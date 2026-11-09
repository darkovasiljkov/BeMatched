namespace API.SignalR;

// A hub instance is short-lived; this singleton remembers connections across hubs.
public class PresenceTracker
{
    private readonly Dictionary<string, HashSet<string>> connections = [];
    private readonly object syncLock = new();

    public bool Connected(string memberId, string connectionId)
    {
        lock (syncLock)
        {
            var firstConnection = !connections.TryGetValue(memberId, out var memberConnections);
            if (firstConnection) connections[memberId] = memberConnections = [];
            memberConnections!.Add(connectionId);
            return firstConnection;
        }
    }

    public bool Disconnected(string memberId, string connectionId)
    {
        lock (syncLock)
        {
            if (!connections.TryGetValue(memberId, out var memberConnections)) return false;
            memberConnections.Remove(connectionId);
            if (memberConnections.Count > 0) return false;
            connections.Remove(memberId);
            return true;
        }
    }

    public string[] GetOnlineUsers()
    {
        lock (syncLock) return connections.Keys.ToArray();
    }
}
