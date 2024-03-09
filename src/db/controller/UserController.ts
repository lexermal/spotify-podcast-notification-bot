import DatabaseController from "../DatabaseController";
import { User } from "../entity/User";

export default class UserController {

    getDBTable() {
        return DatabaseController.getConnection().getRepository(User);
    }

    async exists(chatId: number) {
        return (await this.getDBTable().findOneBy({ chatId })) != null;
    }

    async add(user: User) {
        if (!await this.exists(user.chatId)) {
            await this.getDBTable().save(user);
        }
    }
}
