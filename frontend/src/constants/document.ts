import { RunningStatus } from './knowledge';

export const RunningStatusMap = {
  [RunningStatus.UNSTART]: {
    label: 'UNSTART',
    color: 'info',
  },
  [RunningStatus.RUNNING]: {
    label: 'Parsing',
    color: 'primary',
  },
  [RunningStatus.CANCEL]: { label: 'CANCEL', color: 'warning' },
  [RunningStatus.DONE]: { label: 'SUCCESS', color: 'success' },
  [RunningStatus.FAIL]: { label: 'FAIL', color: 'error' },
};
