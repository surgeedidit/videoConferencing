import bcrypt from 'bcrypt';
import { Service } from 'typedi';

@Service('bcrypt')
export default class BCrypt {
    public generateHash = async (password: string): Promise<string> => {
        return await bcrypt.hash(password, 10);
    };

    public verifyPassword = async (password: string, hash: string): Promise<boolean> => {
        return await bcrypt.compare(password, hash);
    };
}
