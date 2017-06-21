
export function parseSearchQuery() {
    const search = window.location.search;
    const params = {};

    if (search) {
        const parts = search.replace(/^\?/, '').split(/&/);

        for (let part of parts) {
            const [, name, value] = part.match(/^([^=]+)(?:=(.*?))?$/);

            params[name] = value === null ? true : value;
        }
    }

    return params;
}
