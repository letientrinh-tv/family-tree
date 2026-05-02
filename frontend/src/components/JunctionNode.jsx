import { memo } from 'react'
import { Handle, Position } from 'reactflow'

const JunctionNode = memo(() => (
  <div style={{ width: 2, height: 2, background: '#8B4513', borderRadius: '50%' }}>
    <Handle type="source" id="left" position={Position.Left}
      style={{ width: 1, height: 1, minWidth: 1, background: 'transparent', border: 'none', opacity: 0 }} />
    <Handle type="source" id="right" position={Position.Right}
      style={{ width: 1, height: 1, minWidth: 1, background: 'transparent', border: 'none', opacity: 0 }} />
    <Handle type="source" id="bottom" position={Position.Bottom}
      style={{ width: 1, height: 1, minWidth: 1, background: 'transparent', border: 'none', opacity: 0 }} />
  </div>
))

JunctionNode.displayName = 'JunctionNode'
export default JunctionNode
