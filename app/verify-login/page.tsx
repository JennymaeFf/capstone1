import OtpVerificationForm from "@/components/otp-verification-form";

export default function VerifyLoginPage() {
  return (
    <OtpVerificationForm
      purpose="login"
      title="Login Verification"
      message="Enter the code sent to your email to continue"
    />
  );
}
