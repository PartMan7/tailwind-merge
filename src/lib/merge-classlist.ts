import { ConfigUtils } from './config-utils'
import { IMPORTANT_MODIFIER, sortModifiers } from './modifier-utils'

const SPLIT_CLASSES_REGEX = /\s+/

export function mergeClassList(classList: string, configUtils: ConfigUtils) {
    const { splitModifiers, getClassGroupId, getConflictingClassGroupIds } = configUtils

    /**
     * Set of classGroupIds in following format:
     * `{importantModifier}{variantModifiers}{classGroupId}`
     * @example 'float'
     * @example 'hover:focus:bg-color'
     * @example 'md:!pr'
     */
    const classGroupsInConflict = new Set<string>()

    return classList
        .trim()
        .split(SPLIT_CLASSES_REGEX)
        .reverse()
        .map((originalClassName) => {
            const { modifiers, hasImportantModifier, baseClassName, maybePostfixModifierPosition } =
                splitModifiers(originalClassName)

            let classGroupId = getClassGroupId(
                maybePostfixModifierPosition
                    ? baseClassName.substring(0, maybePostfixModifierPosition)
                    : baseClassName,
            )

            let hasPostfixModifier = Boolean(maybePostfixModifierPosition)

            if (!classGroupId) {
                if (!maybePostfixModifierPosition) return originalClassName
                classGroupId = getClassGroupId(baseClassName)
                if (!classGroupId) return originalClassName
                hasPostfixModifier = false
            }

            const variantModifier = sortModifiers(modifiers).join(':')
            const modifierId = hasImportantModifier
                ? variantModifier + IMPORTANT_MODIFIER
                : variantModifier

            const classId = modifierId + classGroupId
            if (classGroupsInConflict.has(classId)) return ''
            classGroupsInConflict.add(classId)

            getConflictingClassGroupIds(classGroupId, hasPostfixModifier).forEach((group) =>
                classGroupsInConflict.add(modifierId + group),
            )
            return originalClassName
        })
        .filter((className) => className)
        .reverse()
        .join(' ')
}
