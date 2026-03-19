export type {
  SandboxInstance,
  SandboxOptions,
} from './shared/protocol'

export type {
  HostToVmMessage,
  SandboxedEventPayload,
  SandboxedEventTargetSnapshot,
  SerializedNode,
  TemplateDescriptor,
  VmPatch,
  VmToHostMessage,
} from './shared/protocol'

export { sandbox } from './host/instance'
