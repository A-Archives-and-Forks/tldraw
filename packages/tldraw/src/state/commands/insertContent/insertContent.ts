/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Utils } from '@tldraw/core'
import { Vec } from '@tldraw/vec'
import { GRID_SIZE } from '~constants'
import { TLDR } from '~state/TLDR'
import type { PagePartial, TldrawCommand, TDShape, TDBinding, TDAsset } from '~types'
import type { TldrawApp } from '../../internal'

export function insertContent(
  app: TldrawApp,
  content: { shapes: TDShape[]; bindings?: TDBinding[]; assets?: TDAsset[] },
  opts = {} as { point?: number[]; select?: boolean }
): TldrawCommand {
  const { currentPageId } = app

  const before: PagePartial = {
    shapes: {},
    bindings: {},
  }

  const after: PagePartial = {
    shapes: {},
    bindings: {},
  }

  const oldToNewIds: Record<string, string> = {}

  // The index of the new shape
  let nextIndex = TLDR.getTopChildIndex(app.state, currentPageId)

  const shapesToInsert: TDShape[] = content.shapes
    .sort((a, b) => a.childIndex - b.childIndex)
    .map((shape) => {
      const newShapeId = Utils.uniqueId()
      oldToNewIds[shape.id] = newShapeId

      // The redo should include a clone of the new shape
      return {
        ...Utils.deepClone(shape),
        id: newShapeId,
      }
    })

  const visited = new Set<string>()

  // Iterate through the list, starting from the front
  while (shapesToInsert.length > 0) {
    const shape = shapesToInsert.shift()

    if (!shape) break

    visited.add(shape.id)

    if (shape.parentId === 'currentPageId') {
      shape.parentId = currentPageId
      shape.childIndex = nextIndex++
    } else {
      // The shape had another shape as its parent.

      // Re-assign the shape's parentId to the new id
      shape.parentId = oldToNewIds[shape.parentId]

      // Has that parent been added yet to the after object?
      const parent = after.shapes[shape.parentId]

      if (!parent) {
        if (visited.has(shape.id)) {
          // If we've already visited this shape, then that means
          // its parent was not among the shapes to insert. Set it
          // to be a child of the current page instead.
          shape.parentId = 'currentPageId'
        }

        // If the parent hasn't been added yet, push this shape
        // to back of the queue; we'll try and add it again later
        shapesToInsert.push(shape)
        continue
      }

      // If we've found the parent, add this shape's id to its children
      parent.children!.push(shape.id)
    }

    // If the inserting shape has its own children, set the children to
    // an empty array; we'll add them later, as just shown above
    if (shape.children) {
      shape.children = []
    }

    // The undo should remove the inserted shape
    before.shapes[shape.id] = undefined

    // The redo should include the inserted shape
    after.shapes[shape.id] = shape
  }

  Object.values(after.shapes).forEach((shape) => {
    // If the shape used to have children, but no longer does have children,
    // then delete the shape. This prevents inserting groups without children.
    if (shape!.children && shape!.children.length === 0) {
      delete before.shapes[shape!.id!]
      delete after.shapes[shape!.id!]
    }
  })

  // Insert bindings
  if (content.bindings) {
    content.bindings.forEach((binding) => {
      const newBindingId = Utils.uniqueId()
      oldToNewIds[binding.id] = newBindingId

      const toId = oldToNewIds[binding.toId]
      const fromId = oldToNewIds[binding.fromId]

      // If the binding is "to" or "from" a shape that hasn't been inserted,
      // we'll need to skip the binding and remove it from any shape that
      // references it.
      if (!toId || !fromId) {
        if (fromId) {
          const handles = after.shapes[fromId]!.handles
          if (handles) {
            Object.values(handles).forEach((handle) => {
              if (handle!.bindingId === binding.id) {
                handle!.bindingId = undefined
              }
            })
          }
        }

        if (toId) {
          const handles = after.shapes[toId]!.handles
          if (handles) {
            Object.values(handles).forEach((handle) => {
              if (handle!.bindingId === binding.id) {
                handle!.bindingId = undefined
              }
            })
          }
        }

        return
      }

      // Update the shape's to and from references to the new bindingid

      const fromHandles = after.shapes[fromId]!.handles
      if (fromHandles) {
        Object.values(fromHandles).forEach((handle) => {
          if (handle!.bindingId === binding.id) {
            handle!.bindingId = newBindingId
          }
        })
      }

      const toHandles = after.shapes[toId]!.handles
      if (toHandles) {
        Object.values(after.shapes[toId]!.handles!).forEach((handle) => {
          if (handle!.bindingId === binding.id) {
            handle!.bindingId = newBindingId
          }
        })
      }

      const newBinding = {
        ...Utils.deepClone(binding),
        id: newBindingId,
        toId,
        fromId,
      }

      // The undo should remove the inserted binding
      before.bindings[newBinding.id] = undefined

      // The redo should include the inserted binding
      after.bindings[newBinding.id] = newBinding
    })
  }

  // Now move the shapes

  const shapesToMove = Object.values(after.shapes) as TDShape[]

  const { point, select } = opts

  if (shapesToMove.length > 0) {
    if (point) {
      // Move the shapes so that they're centered on the given point
      const commonBounds = Utils.getCommonBounds(shapesToMove.map((shape) => TLDR.getBounds(shape)))
      const center = Utils.getBoundsCenter(commonBounds)
      shapesToMove.forEach((shape) => {
        if (!shape.point) return
        shape.point = Vec.sub(point, Vec.sub(center, shape.point))
      })
    } else {
      const commonBounds = Utils.getCommonBounds(shapesToMove.map(TLDR.getBounds))

      if (
        !(
          Utils.boundsContain(app.viewport, commonBounds) ||
          Utils.boundsCollide(app.viewport, commonBounds)
        )
      ) {
        const center = Vec.toFixed(app.getPagePoint(app.centerPoint))

        const centeredBounds = Utils.centerBounds(commonBounds, center)

        const delta = Vec.sub(
          Utils.getBoundsCenter(centeredBounds),
          Utils.getBoundsCenter(commonBounds)
        )

        shapesToMove.forEach((shape) => {
          shape.point = Vec.toFixed(Vec.add(shape.point, delta))
        })
      }
    }
  }

  return {
    id: 'insert',
    before: {
      document: {
        pages: {
          [currentPageId]: before,
        },
        pageStates: {
          [currentPageId]: { selectedIds: [...app.selectedIds] },
        },
      },
    },
    after: {
      document: {
        pages: {
          [currentPageId]: after,
        },
        assets: content.assets
          ? Object.fromEntries(
              content.assets
                .filter((asset) => !app.document.assets[asset.id])
                .map((asset) => [asset.id, asset])
            )
          : {},
        pageStates: {
          [currentPageId]: {
            selectedIds: select ? Object.keys(after.shapes) : [...app.selectedIds],
          },
        },
      },
    },
  }
}
