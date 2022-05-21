/**
 * Recursively remove `prop` from all objects/sub-objects.
 */
export function filterProp<T extends object>(obj: T, prop: string): T {
    const ret = JSON.parse(JSON.stringify(obj));

    function filterPropMut(obj: any) {
        if (obj == null || typeof obj !== "object") {
            return;
        }
        if (Array.isArray(obj)) {
            obj.forEach(filterPropMut);
            return;
        }

        delete obj[prop];
        Object.values(obj).forEach(filterPropMut);
    }

    filterPropMut(ret);

    return ret;
}
