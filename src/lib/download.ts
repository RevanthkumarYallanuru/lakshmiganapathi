import { api } from "@/api/client";

/**
 * Downloads a protected (auth-required) file endpoint. A plain <a href>
 * can't carry the Authorization header, so this fetches the file as a
 * blob through the same authenticated axios instance as everything
 * else, then triggers a normal browser save via an object URL.
 */
export async function downloadFile(
  path: string,
  params: Record<string, string | undefined> | undefined,
  fallbackFilename: string
): Promise<void> {
  const response = await api.get(path, {
    params,
    responseType: "blob",
  });

  const disposition = response.headers["content-disposition"] as
    | string
    | undefined;
  const match = disposition?.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? fallbackFilename;

  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
