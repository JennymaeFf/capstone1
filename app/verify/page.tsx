import OtpVerificationForm from "@/components/otp-verification-form";

export default function VerifyPage() {
  return (
    <OtpVerificationForm
      purpose="registration"
      title="Verify Account"
      message="Enter the verification code sent to your email"
    />
  );
}
