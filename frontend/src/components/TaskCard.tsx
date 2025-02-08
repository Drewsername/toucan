"use client";

import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@heroui/react";
import React, { useState } from "react";
import { useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store/authStore';
import type { Task } from '../store/taskStore';
import { formatDate } from '../utils/date';
import '../index.css';

interface TaskCardProps {
  task: Task;
  isAssignee: boolean;
  status: 'active' | 'completed' | 'cancelled';
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isAssignee,
  status
}) => {
  const { completeTask, validateTask } = useTaskStore();
  const { profile } = useAuthStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await completeTask(task.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await validateTask(task.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="bg-content1 border-none">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-lg font-semibold">{task.title}</p>
            {task.random_payout ? (
              <p className="text-small text-default-500">
                Points: {task.min_points} - {task.max_points}
              </p>
            ) : (
              <p className="text-small text-default-500">Points: {task.points}</p>
            )}
          </div>
        </CardHeader>
        <Divider/>
        <CardBody>
          <p className="text-default-700">{task.description}</p>
          {task.due_date && (
            <p className="text-small text-default-500 mt-2">
              Due: {formatDate(task.due_date)}
            </p>
          )}
          {error && (
            <p className="text-small text-danger mt-2">{error}</p>
          )}
        </CardBody>
        <CardFooter className="gap-2">
          {status === 'active' && isAssignee && (
            <Button 
              color="primary"
              variant="solid"
              onPress={onOpen}
              isLoading={isLoading}
            >
              Complete
            </Button>
          )}
          {status === 'completed' && task.validation_required && !task.validated && profile?.is_admin && (
            <Button 
              color="success"
              variant="solid"
              onPress={onOpen}
              isLoading={isLoading}
            >
              Validate
            </Button>
          )}
        </CardFooter>
      </Card>

      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {status === 'active' ? 'Complete Task' : 'Validate Task'}
              </ModalHeader>
              <ModalBody>
                <p>Are you sure you want to {status === 'active' ? 'complete' : 'validate'} this task?</p>
                <p className="text-small text-default-500">{task.title}</p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color={status === 'active' ? 'primary' : 'success'}
                  onPress={status === 'active' ? handleComplete : handleValidate}
                  isLoading={isLoading}
                >
                  {status === 'active' ? 'Complete' : 'Validate'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default TaskCard; 