// Uniform success envelope so the frontend can rely on a single shape.
export function ok(res, data, meta) {
  return res.status(200).json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function created(res, data) {
  return res.status(201).json({ success: true, data });
}

export function noContent(res) {
  return res.status(204).send();
}

// Paginated list envelope: { rows, total } plus pagination meta.
export function paginated(res, rows, total, page, pageSize) {
  return res.status(200).json({
    success: true,
    data: { rows, total },
    meta: { page, pageSize, total, pages: Math.ceil(total / pageSize) || 1 },
  });
}
