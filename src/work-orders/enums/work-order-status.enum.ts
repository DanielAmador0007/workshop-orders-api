export enum WorkOrderStatus {
  RECEIVED = 'RECEIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DELIVERED = 'DELIVERED',
}

export const VALID_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus | null> = {
  [WorkOrderStatus.RECEIVED]: WorkOrderStatus.IN_PROGRESS,
  [WorkOrderStatus.IN_PROGRESS]: WorkOrderStatus.COMPLETED,
  [WorkOrderStatus.COMPLETED]: WorkOrderStatus.DELIVERED,
  [WorkOrderStatus.DELIVERED]: null,
};
