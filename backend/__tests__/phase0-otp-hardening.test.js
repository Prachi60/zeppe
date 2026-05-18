import { jest } from "@jest/globals";

const mockCustomerFindOne = jest.fn();
const mockCustomerCreate = jest.fn();
const mockCustomerFindById = jest.fn();
const mockCustomerUpdateOne = jest.fn().mockResolvedValue(true);

jest.unstable_mockModule("../app/models/customer.js", () => ({
  default: {
    findOne: mockCustomerFindOne,
    create: mockCustomerCreate,
    findById: mockCustomerFindById,
    updateOne: mockCustomerUpdateOne,
  },
}));

jest.unstable_mockModule("../app/utils/otp.js", () => ({
  generateOTP: jest.fn(() => "1234"),
  useRealSMS: jest.fn(() => false),
  useRealEmail: jest.fn(() => false),
}));

const { issueCustomerOtp, verifyCustomerOtpCode } = await import(
  "../app/services/otpAuthService.js"
);

function buildCustomer(overrides = {}) {
  return {
    _id: "customer-1",
    name: "Test User",
    email: "test@example.com",
    isVerified: false,
    otpHash: null,
    otpExpiresAt: null,
    otpFailedAttempts: 0,
    otpLockedUntil: null,
    otpLastSentAt: null,
    otpSessionVersion: 0,
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function mockFindOneSelect(customerOrNull) {
  mockCustomerFindOne.mockReturnValue({
    select: jest.fn().mockResolvedValue(customerOrNull),
  });
}

describe("Phase 0 OTP hardening", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OTP_RESEND_COOLDOWN_SECONDS = "60";
    process.env.OTP_MAX_FAILED_ATTEMPTS = "5";
    process.env.OTP_LOCKOUT_MINUTES = "10";
    process.env.OTP_HASH_SECRET = "otp-test-secret";
  });

  it("enforces resend cooldown", async () => {
    const customer = buildCustomer({
      email: "user1@example.com",
      otpLastSentAt: new Date(Date.now() - 10 * 1000),
    });
    mockFindOneSelect(customer);

    await expect(
      issueCustomerOtp({
        name: "User 1",
        rawEmail: "user1@example.com",
        flow: "signup",
        ipAddress: "127.0.0.1",
      }),
    ).rejects.toMatchObject({ statusCode: 429 });
  });

  it("locks out number after repeated OTP verification failures", async () => {
    const customer = buildCustomer({
      email: "user2@example.com",
      otpHash: "some-other-hash",
      otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      otpFailedAttempts: 4,
    });
    mockFindOneSelect(customer);

    await expect(
      verifyCustomerOtpCode({
        rawEmail: "user2@example.com",
        otp: "9999",
        ipAddress: "127.0.0.1",
      }),
    ).rejects.toMatchObject({ statusCode: 423 });

    expect(customer.save).toHaveBeenCalled();
    expect(customer.otpLockedUntil).toBeTruthy();
  });

  it("never stores raw OTP in DB fields", async () => {
    const customer = buildCustomer({
      email: "user3@example.com",
      otpLastSentAt: new Date(Date.now() - 120 * 1000),
    });
    mockFindOneSelect(customer);

    await issueCustomerOtp({
      name: "User 3",
      rawEmail: "user3@example.com",
      flow: "signup",
      ipAddress: "127.0.0.1",
    });

    expect(customer.otp).toBeUndefined();
    expect(customer.otpHash).toBeTruthy();
    expect(customer.otpHash).not.toBe("1234");
    expect(customer.save).toHaveBeenCalled();
  });
});
