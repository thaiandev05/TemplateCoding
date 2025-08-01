import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway } from "@nestjs/websockets";
import { TicketService } from "./ticket.service";
import { Request } from 'express'
@WebSocketGateway({
    cors: true
})

export class SocketGateWay implements OnGatewayConnection, OnGatewayDisconnect {

    constructor(
        private readonly ticketService: TicketService
    ) { }

    // join connection 
    async handleConnection(req: Request) {
        // get userId from request
        const userId = req.user.id

        if (userId) {
            await this.ticketService.setUserOnline(userId)
            console.log(`🟢 User ${userId} online`);
        }
    }

    // get out connection
    async handleDisconnect(req: Request) {
        // get userId from request
        const userId = req.user.id

        if (userId) {
            await this.ticketService.setUserOffline(userId)
            console.log(`🔴 User ${userId} offline`);
        }
    }

}