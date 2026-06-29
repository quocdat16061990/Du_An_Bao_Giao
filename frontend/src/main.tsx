import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Fix Google Translate / browser extensions modifying DOM structure and causing React to crash
if (typeof window !== 'undefined') {
  const originalRemoveChild = Node.prototype.removeChild
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    try {
      return originalRemoveChild.call(this, child) as T
    } catch (e) {
      return child
    }
  }

  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function <T extends Node>(
    this: Node,
    newNode: T,
    referenceNode: Node | null
  ): T {
    try {
      return originalInsertBefore.call(this, newNode, referenceNode) as T
    } catch (e) {
      return newNode
    }
  }
}

const container = document.getElementById('root')
if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
