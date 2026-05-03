import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    node: process.versions.node,
  },
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
})
