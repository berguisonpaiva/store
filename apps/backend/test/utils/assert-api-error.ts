type ApiErrorBody = {
  statusCode?: number;
  message?: string | string[];
};

export function expectApiError(
  body: ApiErrorBody,
  expected: {
    status: number;
    code: string;
  },
): void {
  expect(body.statusCode).toBe(expected.status);

  const rawMessage = Array.isArray(body.message)
    ? body.message.join(' ')
    : String(body.message ?? '');

  expect(rawMessage).toContain(expected.code);
}
