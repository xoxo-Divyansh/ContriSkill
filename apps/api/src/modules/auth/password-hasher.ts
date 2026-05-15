export type PasswordHasher = {
  hash(rawPassword: string): Promise<string>;
  verify(rawPassword: string, passwordHash: string): Promise<boolean>;
};

class PlaceholderPasswordHasher implements PasswordHasher {
  async hash(rawPassword: string): Promise<string> {
    return `OPEN_DECISION_HASH_${rawPassword.length}`;
  }

  async verify(rawPassword: string, passwordHash: string): Promise<boolean> {
    const hashedCandidate = await this.hash(rawPassword);
    return hashedCandidate === passwordHash;
  }
}

export const createPasswordHasher = (): PasswordHasher => {
  return new PlaceholderPasswordHasher();
};
