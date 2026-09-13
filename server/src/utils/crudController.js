import { asyncHandler } from './asyncHandler.js';
import { ok, created, paginated } from './ApiResponse.js';
import { ApiError } from './ApiError.js';
import { parseListParams, searchFilter, equalityFilters } from './query.js';
import { logActivity } from '../services/activity.service.js';

/**
 * Build standard list/get/create/update/remove handlers for a Mongoose model.
 *
 * @param {import('mongoose').Model} Model
 * @param {object} opts
 *   - entity: string label for audit logs (e.g. 'customer')
 *   - searchFields: string[] fields for free-text search
 *   - filterFields: string[] query keys allowed as equality filters
 *   - populate: array/string passed to .populate()
 *   - defaultSort: object e.g. { created_at: -1 }
 *   - transformWrite: (body, req) => body  (hook before create/update)
 */
export function crudController(Model, opts = {}) {
  const {
    entity = Model.modelName.toLowerCase(),
    searchFields = [],
    filterFields = [],
    populate,
    defaultSort = { created_at: -1 },
    transformWrite = (b) => b,
  } = opts;

  const list = asyncHandler(async (req, res) => {
    const { page, pageSize, search, sortBy, sortDir, skip } = parseListParams(req.query);
    const filter = {
      ...searchFilter(search, searchFields),
      ...equalityFilters(req.query, filterFields),
    };
    const sort = sortBy ? { [sortBy]: sortDir } : defaultSort;

    let q = Model.find(filter).sort(sort).skip(skip).limit(pageSize);
    if (populate) q = q.populate(populate);
    const [rows, total] = await Promise.all([
      q.lean({ virtuals: true }),
      Model.countDocuments(filter),
    ]);
    return paginated(res, rows.map(withId), total, page, pageSize);
  });

  const get = asyncHandler(async (req, res) => {
    let q = Model.findById(req.params.id);
    if (populate) q = q.populate(populate);
    const doc = await q.lean({ virtuals: true });
    if (!doc) throw ApiError.notFound(`${entity} not found`);
    return ok(res, withId(doc));
  });

  const create = asyncHandler(async (req, res) => {
    const doc = await Model.create(transformWrite(req.body, req));
    await logActivity(req, 'create', entity, doc.id);
    return created(res, doc.toJSON());
  });

  const update = asyncHandler(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, transformWrite(req.body, req), {
      new: true,
      runValidators: true,
    });
    if (!doc) throw ApiError.notFound(`${entity} not found`);
    await logActivity(req, 'update', entity, doc.id, req.body);
    return ok(res, doc.toJSON());
  });

  const remove = asyncHandler(async (req, res) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) throw ApiError.notFound(`${entity} not found`);
    await logActivity(req, 'delete', entity, req.params.id);
    return ok(res, { success: true });
  });

  return { list, get, create, update, remove };
}

function withId(doc) {
  if (doc && doc._id) doc.id = String(doc._id);
  return doc;
}
