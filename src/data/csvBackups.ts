import eraRaw from '../../ERA_members.csv?raw';
import fffRaw from '../../FFF_members.csv?raw';
import teaRaw from '../../TEA_members.csv?raw';
import vikRaw from '../../VIK_members.csv?raw';
import { Alliance } from '../types/roster';

export const CSV_BACKUP_DATA: Record<Alliance, string> = {
  ERA: eraRaw,
  FFF: fffRaw,
  TEA: teaRaw,
  VIK: vikRaw,
};
