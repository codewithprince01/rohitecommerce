// Helpers to translate the frontend's ListParams (page/pageSize/search/sort/filters)
// into Mongoose query options. Keeps every list endpoint consistent.

export function parseListParams(query, { maxPageSize = 100 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const pageSize = Math.min(maxPageSize, Math.max(1, parseInt(query.pageSize, 10) || 10));
  const search = (query.search || '').toString().trim();
  const sortBy = (query.sortBy || 'createdAt').toString();
  const sortDir = query.sortDir === 'asc' ? 1 : -1;
  return { page, pageSize, search, sortBy, sortDir, skip: (page - 1) * pageSize };
}

// Build a case-insensitive OR regex filter across the given fields.
export function searchFilter(search, fields) {
  if (!search || !fields.length) return {};
  const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = new RegExp(safe, 'i');
  return { $or: fields.map((f) => ({ [f]: rx })) };
}

// Pick allowed equality filters from the query string (ignores empty values).
export function equalityFilters(query, allowed) {
  const out = {};
  for (const key of allowed) {
    const value = query[key];
    if (value === undefined || value === null || value === '') continue;
    if (value === 'true') out[key] = true;
    else if (value === 'false') out[key] = false;
    else out[key] = value;
  }
  return out;
}
