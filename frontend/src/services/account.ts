const ACCOUNT_API_BASE_URL = "http://localhost:5000/api/account";

export type DeleteAccountPayload = {
  currentPassword: string;
  confirmationPhrase: string;
};

function getApiMessage(data: unknown, fallback: string) {
  if (typeof data !== "object" || data === null) {
    return fallback;
  }

  const payload = data as { message?: unknown; error?: unknown };

  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }

  return fallback;
}

function getDownloadFilename(response: Response) {
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const regularMatch = disposition.match(/filename="?([^";]+)"?/i);
  const filename = encodedMatch?.[1] ?? regularMatch?.[1];

  if (filename) {
    try {
      return decodeURIComponent(filename.trim());
    } catch {
      return filename.trim();
    }
  }

  return `i-nelory-export-${new Date().toISOString().slice(0, 10)}.zip`;
}

export async function exportAccountData(token: string) {
  const response = await fetch(`${ACCOUNT_API_BASE_URL}/export`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(getApiMessage(data, "Unable to prepare your data export."));
  }

  return {
    blob: await response.blob(),
    filename: getDownloadFilename(response),
  };
}

export async function deleteAccount(
  token: string,
  payload: DeleteAccountPayload,
) {
  const response = await fetch(ACCOUNT_API_BASE_URL, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      getApiMessage(data, "Unable to delete your account. Please try again."),
    );
  }

  return data as { message: string };
}
