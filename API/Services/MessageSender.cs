using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Interfaces;
using API.SignalR;
using Microsoft.AspNetCore.SignalR;

namespace API.Services;

// Both REST and the hub use the same validation, database save, and notification.
public class MessageSender(IMessageRepository messageRepository, IMemberRepository memberRepository,
    IHubContext<PresenceHub> presenceHub, ILogger<MessageSender> logger)
{
    public async Task<MessageDto?> SendMessage(string senderId, CreateMessageDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Content) || string.IsNullOrWhiteSpace(request.RecipientId)
            || senderId == request.RecipientId) return null;

        var sender = await memberRepository.GetMemberByIdAsync(senderId);
        var recipient = await memberRepository.GetMemberByIdAsync(request.RecipientId);
        if (sender == null || recipient == null) return null;
        sender.LastActive = DateTime.UtcNow; // Hub calls do not run LogUserActivity.

        var message = new Message
        {
            SenderId = senderId,
            Sender = sender,
            RecipientId = recipient.Id,
            Recipient = recipient,
            Content = request.Content.Trim()
        };
        messageRepository.AddMessage(message);
        if (!await messageRepository.SaveAllAsync()) return null;

        var response = message.ToDto();
        try
        {
            // User IDs come from JWT claims. All tabs for these two users receive it.
            await presenceHub.Clients.Users(senderId, recipient.Id).SendAsync("NewMessage", response);
        }
        catch (Exception exception)
        {
            // The message is already saved. Do not report a failed send and invite duplicates.
            logger.LogWarning(exception, "Live notification failed for message {MessageId}", message.Id);
        }
        return response;
    }
}
