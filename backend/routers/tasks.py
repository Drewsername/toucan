from fastapi import APIRouter, Depends, HTTPException, Response
from typing import List
from models.task import Task, TaskCreate
from models.user import User
from dependencies import get_current_user

router = APIRouter(prefix="/tasks", tags=["tasks"])

def add_cors_headers(response: Response):
    """Add CORS headers to response"""
    response.headers["Access-Control-Allow-Origin"] = "https://www.get-toucan.com"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Expose-Headers"] = "*"

@router.options("/{path:path}")
async def options_route(response: Response):
    """Handle OPTIONS requests"""
    add_cors_headers(response)
    return {}

@router.post("/")
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    response: Response = None
):
    """Create a new task"""
    if response:
        add_cors_headers(response)
        
    # Get the assignee (must be the partner)
    assignee = await current_user.get_partner()
    if not assignee:
        raise HTTPException(400, "You must be paired to create tasks")
        
    # Create and save the task
    task = Task.from_create_request(task_data, current_user, assignee)
    
    if not await task.save():
        raise HTTPException(500, "Failed to create task")
        
    return {"id": task.id, "message": "Task created successfully"}

@router.get("/active")
async def get_active_tasks(
    current_user: User = Depends(get_current_user),
    response: Response = None
) -> List[dict]:
    """Get all active tasks for the current user"""
    if response:
        add_cors_headers(response)
        
    tasks = await Task.get_active_tasks(current_user)
    return [
        {
            "id": task.id,
            "title": task.data.title,
            "description": task.data.description,
            "points": task.data.points,
            "creator_id": task.data.creator_id,
            "assignee_id": task.data.assignee_id,
            "status": task.data.status,
            "validation_required": task.data.validation_required,
            "random_payout": task.data.random_payout,
            "min_points": task.data.min_points,
            "max_points": task.data.max_points,
            "due_date": task.data.due_date
        }
        for task in tasks
    ]

@router.post("/{task_id}/complete")
async def complete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    response: Response = None
):
    """Complete a task"""
    if response:
        add_cors_headers(response)
        
    task = await Task.get_by_id(task_id, current_user)
    if not task:
        raise HTTPException(404, "Task not found")
        
    if not await task.complete(current_user):
        raise HTTPException(400, "Cannot complete this task")
        
    return {"message": "Task completed successfully"}

@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    response: Response = None
):
    """Delete a task. Only the creator can delete their tasks."""
    if response:
        add_cors_headers(response)
        
    task = await Task.get_by_id(task_id, current_user)
    if not task:
        raise HTTPException(404, "Task not found")
        
    if not await task.delete(current_user):
        raise HTTPException(403, "Only the task creator can delete active tasks")
        
    return {"message": "Task deleted successfully"} 