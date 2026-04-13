/**
 * Safely extract a user-facing error message from an Axios error.
 *
 * FastAPI validation errors return `detail` as an array of objects:
 *   [{ "loc": [...], "msg": "...", "type": "..." }]
 *
 * Passing such an array directly to toast.error() or into JSX causes:
 *   "Objects are not valid as a React child"
 *
 * This helper always returns a plain string.
 */
export function getErr(e, fallback = "Something went wrong") {
  const detail = e?.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map(d => (typeof d === "string" ? d : d?.msg || JSON.stringify(d))).join("; ");
  }
  if (typeof detail === "object") return detail.msg || fallback;
  return String(detail) || fallback;
}
