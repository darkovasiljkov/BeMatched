using System;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize]
public class MessagesController(IMessageRepository messageRepository, IMemberRepository memberRepository) : BaseApiController
{
    [HttpPost]
    public async Task<ActionResult<MessageDto>> CreateMessage (CreateMessageDto createMessageDto)
    {
        var sender = await memberRepository.GetMemberByIdAsync(User.GetMemberId());

        var recipient = await memberRepository.GetMemberByIdAsync(createMessageDto.RecipientId);

        if (recipient == null || sender == null || sender.Id == createMessageDto.RecipientId)
        {
                        return BadRequest("cannot send this message");
        }

        var message = new Message
        {
            SenderId = sender.Id,
            Sender = sender,
            RecipientId = recipient.Id,
            Recipient = recipient,
            Content = createMessageDto.Content
        };

        messageRepository.AddMessage(message);

        if (await messageRepository.SaveAllAsync())
        {
            return message.ToDto();
        }

        return BadRequest("Failed to send message!");
        
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<MessageDto>>> GetMessagesByContainer([FromQuery] MessageParams messageParams)
    {
        messageParams.MemberId = User.GetMemberId();

        return await messageRepository.GetMessagesForMember(messageParams);
    }

    [HttpGet("thread/{recipientId}")]
    public async Task<ActionResult<IReadOnlyList<MessageDto>>> GetMessageThread(string recipientId)
    {
        return Ok(await messageRepository.GetMessageThread(User.GetMemberId(), recipientId));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteMessage(string id)
    {
        var memberId = User.GetMemberId();

        var message = await messageRepository.GetMessage(id);

        if (message == null) return NotFound();

        if (message.SenderId != memberId && message.RecipientId != memberId)
        {
            return Forbid();
        }

        // Repeating a deletion should still succeed.
        if ((message.SenderId == memberId && message.SenderDeleted)
            || (message.RecipientId == memberId && message.RecipientDeleted))
        {
            return NoContent();
        }

        if (message.SenderId == memberId)
        {
            message.SenderDeleted = true;
        }
        if (message.RecipientId == memberId)
        {
            message.RecipientDeleted = true;
        }

        if (message is { SenderDeleted: true, RecipientDeleted: true })
        {
            messageRepository.DeleteMessage(message);
        }

        if (await messageRepository.SaveAllAsync()) return NoContent();
        return BadRequest("Problem deleting message!");
    }
}
