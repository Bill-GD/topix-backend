import * as otp from 'otp-generator';

export function generateOTP(): string {
  return otp.generate(8, {
    specialChars: false,
    upperCaseAlphabets: false,
  });
}

export function sendEmail(): void {

}
