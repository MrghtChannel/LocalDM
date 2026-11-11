export type NpcDialogButton = {
  id: string;
  label: string;
};

export type NpcDialogData = {
  actor?: string;
  text: string;
  buttons?: NpcDialogButton[];
};

export type NpcDialogApi = {
  show: (data: NpcDialogData) => void;
  hide: () => void;
};

declare global {
  interface Window {
    rentConfirmDialog?: NpcDialogApi;
  }
}
