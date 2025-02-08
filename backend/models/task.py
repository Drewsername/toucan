from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from models.database import Database
from models.user import User

class TaskCreate(BaseModel):
    """Model for task creation requests"""
    title: str
    description: str
    points: int
    validation_required: bool = False
    random_payout: bool = False
    min_points: Optional[int] = None
    max_points: Optional[int] = None
    due_date: Optional[datetime] = None

    @validator('points')
    def validate_points(cls, v):
        if v < 0:
            raise ValueError('Points must be non-negative')
        return v

    @validator('min_points', 'max_points')
    def validate_random_points(cls, v, values):
        if 'random_payout' in values and values['random_payout']:
            if v is None:
                raise ValueError('min_points and max_points are required when random_payout is True')
            if v < 0:
                raise ValueError('Points must be non-negative')
        return v

class TaskBase(BaseModel):
    """Internal model for tasks"""
    title: str
    description: str
    points: int
    creator_id: str
    assignee_id: str
    status: str = "active"  # active, completed, cancelled
    validation_required: bool = False
    random_payout: bool = False
    min_points: Optional[int] = None
    max_points: Optional[int] = None
    due_date: Optional[datetime] = None
    
class Task:
    def __init__(
        self,
        title: str,
        description: str,
        points: int,
        creator: User,
        assignee: User,
        **kwargs
    ):
        self.data = TaskBase(
            title=title,
            description=description,
            points=points,
            creator_id=creator.id,
            assignee_id=assignee.id,
            **kwargs
        )
        self._db = Database()
        self._creator = creator
        self._assignee = assignee
        self.id: Optional[str] = None

    @classmethod
    async def get_by_id(cls, task_id: str, current_user: User) -> Optional['Task']:
        """Get a task by ID, ensuring the user has access to it"""
        db = Database()
        task_data = await db.fetch_one(
            "tasks",
            {"id": task_id},
            extra_checks=lambda t: (
                t["creator_id"] == current_user.id or 
                t["assignee_id"] == current_user.id
            )
        )
        
        if not task_data:
            return None
            
        creator = await User.get_by_id(task_data["creator_id"])
        assignee = await User.get_by_id(task_data["assignee_id"])
        
        if not creator or not assignee:
            return None
            
        task = cls(
            title=task_data["title"],
            description=task_data["description"],
            points=task_data["points"],
            creator=creator,
            assignee=assignee,
            **{k: v for k, v in task_data.items() if k not in [
                "id", "title", "description", "points", 
                "creator_id", "assignee_id"
            ]}
        )
        task.id = task_id
        return task

    @classmethod
    def from_create_request(cls, data: TaskCreate, creator: User, assignee: User) -> 'Task':
        """Create a Task instance from a creation request"""
        return cls(
            title=data.title,
            description=data.description,
            points=data.points,
            creator=creator,
            assignee=assignee,
            validation_required=data.validation_required,
            random_payout=data.random_payout,
            min_points=data.min_points,
            max_points=data.max_points,
            due_date=data.due_date
        )

    async def save(self) -> bool:
        """Save or update the task in the database"""
        if not self._validate_users():
            return False
            
        task_dict = self.data.dict()
        
        # Convert datetime to ISO format string for JSON serialization
        if task_dict.get('due_date'):
            task_dict['due_date'] = task_dict['due_date'].isoformat()
        
        if self.id:
            success = await self._db.update(
                "tasks",
                {"id": self.id},
                task_dict
            )
        else:
            task_id = await self._db.insert("tasks", task_dict)
            if task_id:
                self.id = task_id
                success = True
            else:
                success = False
                
        return success

    async def complete(self, completed_by: User) -> bool:
        """Complete a task and award points"""
        if not self._can_complete(completed_by):
            return False
            
        # Calculate points (handle random payout if enabled)
        points = self._calculate_points()
        
        # Update task status
        self.data.status = "completed"
        if not await self.save():
            return False
            
        # Award points to the creator
        await self._creator.add_points(points)
        
        return True

    def _validate_users(self) -> bool:
        """Ensure users are paired and task assignment is valid"""
        return (
            self._creator.is_paired_with(self._assignee) and
            (self._creator.id != self._assignee.id)
        )

    def _can_complete(self, user: User) -> bool:
        """Check if the user can complete this task"""
        return (
            self.data.status == "active" and
            user.id == self.data.assignee_id and
            (not self.data.validation_required or user.id == self.data.creator_id)
        )

    def _calculate_points(self) -> int:
        """Calculate points for task completion, handling random payouts"""
        if not self.data.random_payout:
            return self.data.points
            
        from random import randint
        min_points = self.data.min_points or self.data.points
        max_points = self.data.max_points or self.data.points
        return randint(min_points, max_points)

    async def delete(self, user: User) -> bool:
        """Delete a task. Only the creator can delete their tasks."""
        if user.id != self._creator.id:
            return False
            
        if self.data.status != "active":
            return False
            
        return await self._db.delete("tasks", {"id": self.id})

    @staticmethod
    async def get_active_tasks(user: User) -> List['Task']:
        """Get all active tasks for a user"""
        db = Database()
        tasks_data = await db.fetch_many(
            "tasks",
            {"status": "active"},
            extra_checks=lambda t: (
                t["creator_id"] == user.id or 
                t["assignee_id"] == user.id
            )
        )
        
        tasks = []
        for task_data in tasks_data:
            creator = await User.get_by_id(task_data["creator_id"])
            assignee = await User.get_by_id(task_data["assignee_id"])
            if creator and assignee:
                task = Task(
                    title=task_data["title"],
                    description=task_data["description"],
                    points=task_data["points"],
                    creator=creator,
                    assignee=assignee,
                    **{k: v for k, v in task_data.items() if k not in [
                        "id", "title", "description", "points", 
                        "creator_id", "assignee_id"
                    ]}
                )
                task.id = task_data["id"]
                tasks.append(task)
                
        return tasks 