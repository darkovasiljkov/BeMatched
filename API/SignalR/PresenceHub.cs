using API.DTOs;
using API.Extensions;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace API.SignalR;

[Authorize]
public class PresenceHub(PresenceTracker tracker, MessageSender messageSender) : Hub
{
    public override async Task OnConnectedAsync()
    {
        var memberId = Context.User!.GetMemberId();
        var firstConnection = tracker.Connected(memberId, Context.ConnectionId);
        await Clients.Caller.SendAsync("GetOnlineUsers", tracker.GetOnlineUsers());
        if (firstConnection) await Clients.Others.SendAsync("UserOnline", memberId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var memberId = Context.User!.GetMemberId();
        if (tracker.Disconnected(memberId, Context.ConnectionId))
            await Clients.Others.SendAsync("UserOffline", memberId);

        await base.OnDisconnectedAsync(exception);
    }

    public async Task<MessageDto> SendMessage(CreateMessageDto request)
    {
        var message = await messageSender.SendMessage(Context.User!.GetMemberId(), request);
        return message ?? throw new HubException("Unable to send this message. Check the recipient and message text.");
    }
}
