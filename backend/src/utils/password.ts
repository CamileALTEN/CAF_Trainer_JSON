export function isStrongPassword(pwd: string, username?: string): boolean {
  if (pwd.length < 10 || pwd.length > 16) return false;

  let types = 0;
  if (/[a-z]/.test(pwd)) types++;
  if (/[A-Z]/.test(pwd)) types++;
  if (/[0-9]/.test(pwd)) types++;
  if (/[^A-Za-z0-9]/.test(pwd)) types++;
  if (types < 3) return false;

  const lower = pwd.toLowerCase();
  if (username && lower.includes(username.toLowerCase())) return false;

  const banned = ['password', 'qwerty', 'azerty', 'iloveyou', 'football'];
  if (banned.some(b => lower.includes(b))) return false;

  if (/^(.)\1{3,}$/.test(pwd)) return false;

  const seq = 'abcdefghijklmnopqrstuvwxyz';
  const numSeq = '0123456789';
  const checkSeq = (s: string) => {
    for (let i = 0; i <= s.length - 4; i++) {
      const sub = s.slice(i, i + 4);
      if (lower.includes(sub) || lower.includes(sub.split('').reverse().join('')))
        return true;
    }
    return false;
  };
  if (checkSeq(seq) || checkSeq(numSeq)) return false;

  return true;
}
