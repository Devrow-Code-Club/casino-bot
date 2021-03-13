/*
Client {
  _events: [Object: null prototype] {
    ready: [Function (anonymous)],
    message: [Function (anonymous)]
  },
  _eventsCount: 2,
  _maxListeners: undefined,
  _timeouts: Set(1) {
    Timeout {
      _idleTimeout: 60000,
      _idlePrev: [TimersList],
      _idleNext: [Timeout],
      _idleStart: 1899,
      _onTimeout: [Function (anonymous)],
      _timerArgs: undefined,
      _repeat: null,
      _destroyed: false,
      [Symbol(refed)]: true,
      [Symbol(kHasPrimitive)]: false,
      [Symbol(asyncId)]: 65,
      [Symbol(triggerId)]: 53
    }
  },
  _intervals: Set(2) {
    Timeout {
      _idleTimeout: 60000,
      _idlePrev: [Timeout],
      _idleNext: [TimersList],
      _idleStart: 1261,
      _onTimeout: [Function (anonymous)],
      _timerArgs: undefined,
      _repeat: 60000,
      _destroyed: false,
      [Symbol(refed)]: true,
      [Symbol(kHasPrimitive)]: false,
      [Symbol(asyncId)]: 14,
      [Symbol(triggerId)]: 0
    },
    Timeout {
      _idleTimeout: 41250,
      _idlePrev: [TimersList],
      _idleNext: [TimersList],
      _idleStart: 1898,
      _onTimeout: [Function (anonymous)],
      _timerArgs: undefined,
      _repeat: 41250,
      _destroyed: false,
      [Symbol(refed)]: true,
      [Symbol(kHasPrimitive)]: false,
      [Symbol(asyncId)]: 64,
      [Symbol(triggerId)]: 53
    }
  },
  _immediates: Set(0) {},
  options: {
    _tokenType: 'Bot',
    shardCount: 1,
    messageCacheMaxSize: 200,
    messageCacheLifetime: 0,
    messageSweepInterval: 0,
    messageEditHistoryMaxSize: -1,
    fetchAllMembers: false,
    disableMentions: 'none',
    partials: [],
    restWsBridgeTimeout: 5000,
    restRequestTimeout: 15000,
    retryLimit: 1,
    restTimeOffset: 500,
    restSweepInterval: 60,
    presence: {},
    ws: {
      large_threshold: 50,
      compress: false,
      properties: [Object],
      version: 6,
      presence: [Object]
    },
    http: {
      version: 7,
      api: 'https://discord.com/api',
      cdn: 'https://cdn.discordapp.com',
      invite: 'https://discord.gg',
      template: 'https://discord.new'
    },
    shards: [ 0 ]
  },
  rest: RESTManager {
    client: [Circular *1],
    handlers: Collection(1) [Map] { '/gateway/bot' => [RequestHandler] },
    tokenPrefix: 'Bot',
    versioned: true,
    globalTimeout: null
  },
  ws: WebSocketManager {
    _events: [Object: null prototype] {},
    _eventsCount: 0,
    _maxListeners: undefined,
    gateway: 'wss://gateway.discord.gg/',
    totalShards: 1,
    shards: Collection(1) [Map] { 0 => [WebSocketShard] },
    status: 0,
    destroyed: false,
    reconnecting: false,
    sessionStartLimit: {
      total: 1000,
      remaining: 999,
      reset_after: 85874836,
      max_concurrency: 1
    },
    [Symbol(kCapture)]: false
  },
  actions: ActionsManager {
    client: [Circular *1],
    MessageCreate: MessageCreateAction { client: [Circular *1] },
    MessageDelete: MessageDeleteAction { client: [Circular *1] },
    MessageDeleteBulk: MessageDeleteBulkAction { client: [Circular *1] },
    MessageUpdate: MessageUpdateAction { client: [Circular *1] },
    MessageReactionAdd: MessageReactionAdd { client: [Circular *1] },
    MessageReactionRemove: MessageReactionRemove { client: [Circular *1] },
    MessageReactionRemoveAll: MessageReactionRemoveAll { client: [Circular *1] },
    MessageReactionRemoveEmoji: MessageReactionRemoveEmoji { client: [Circular *1] },
    ChannelCreate: ChannelCreateAction { client: [Circular *1] },
    ChannelDelete: ChannelDeleteAction { client: [Circular *1], deleted: Map(0) {} },
    ChannelUpdate: ChannelUpdateAction { client: [Circular *1] },
    GuildDelete: GuildDeleteAction { client: [Circular *1], deleted: Map(0) {} },
    GuildUpdate: GuildUpdateAction { client: [Circular *1] },
    InviteCreate: InviteCreateAction { client: [Circular *1] },
    InviteDelete: InviteDeleteAction { client: [Circular *1] },
    GuildMemberRemove: GuildMemberRemoveAction { client: [Circular *1] },
    GuildMemberUpdate: GuildMemberUpdateAction { client: [Circular *1] },
    GuildBanRemove: GuildBanRemove { client: [Circular *1] },
    GuildRoleCreate: GuildRoleCreate { client: [Circular *1] },
    GuildRoleDelete: GuildRoleDeleteAction { client: [Circular *1] },
    GuildRoleUpdate: GuildRoleUpdateAction { client: [Circular *1] },
    PresenceUpdate: PresenceUpdateAction { client: [Circular *1] },
    UserUpdate: UserUpdateAction { client: [Circular *1] },
    VoiceStateUpdate: VoiceStateUpdate { client: [Circular *1] },
    GuildEmojiCreate: GuildEmojiCreateAction { client: [Circular *1] },
    GuildEmojiDelete: GuildEmojiDeleteAction { client: [Circular *1] },
    GuildEmojiUpdate: GuildEmojiUpdateAction { client: [Circular *1] },
    GuildEmojisUpdate: GuildEmojisUpdateAction { client: [Circular *1] },
    GuildRolesPositionUpdate: GuildRolesPositionUpdate { client: [Circular *1] },
    GuildChannelsPositionUpdate: GuildChannelsPositionUpdate { client: [Circular *1] },
    GuildIntegrationsUpdate: GuildIntegrationsUpdate { client: [Circular *1] },
    WebhooksUpdate: WebhooksUpdate { client: [Circular *1] },
    TypingStart: TypingStart { client: [Circular *1] }
  },
  voice: ClientVoiceManager {
    connections: Collection(0) [Map] {},
    broadcasts: []
  },
  shard: null,
  users: UserManager {
    cacheType: [class Collection extends Collection],
    cache: Collection(1) [Map] { '581252437843902475' => [ClientUser] }
  },
  guilds: GuildManager {
    cacheType: [class Collection extends Collection],
    cache: Collection(2) [Map] {
      '580537119173246987' => [Guild],
      '581255423164940288' => [Guild]
    }
  },
  channels: ChannelManager {
    cacheType: [class Collection extends Collection],
    cache: Collection(40) [Map] {
      '639597763562176522' => [TextChannel],
      '593458438340739076' => [TextChannel],
      '580790782685085703' => [TextChannel],
      '706924701192028170' => [TextChannel],
      '593446819124740166' => [TextChannel],
      '580537119173246991' => [TextChannel],
      '801207066395148338' => [TextChannel],
      '737777120788480092' => [TextChannel],
      '580790261295087619' => [TextChannel],
      '733327111342784527' => [CategoryChannel],
      '733325779282296903' => [CategoryChannel],
      '741472115626213437' => [TextChannel],
      '580550763873304586' => [TextChannel],
      '763801739677532210' => [TextChannel],
      '739958233787269252' => [TextChannel],
      '600400033799733258' => [TextChannel],
      '597938033651613707' => [TextChannel],
      '581581652589805594' => [TextChannel],
      '738887473412833410' => [TextChannel],
      '653717009409769473' => [TextChannel],
      '580537119173246995' => [VoiceChannel],
      '640189871637528576' => [TextChannel],
      '738097953771749377' => [VoiceChannel],
      '738404575245107210' => [TextChannel],
      '738404677045059666' => [CategoryChannel],
      '735964782087241850' => [TextChannel],
      '672626546980290560' => [TextChannel],
      '639597810085265419' => [TextChannel],
      '582641793921974272' => [TextChannel],
      '593458136309039125' => [TextChannel],
      '692860332196233216' => [TextChannel],
      '580537119173246989' => [CategoryChannel],
      '733327394034942023' => [CategoryChannel],
      '732338523344076920' => [TextChannel],
      '731277104863379476' => [TextChannel],
      '594208746687954944' => [TextChannel],
      '581255423164940289' => [CategoryChannel],
      '581255423164940290' => [TextChannel],
      '581255423164940291' => [CategoryChannel],
      '581255423164940292' => [VoiceChannel]
    }
  },
  presence: ClientPresence {
    userID: null,
    guild: null,
    status: 'online',
    activities: [],
    clientStatus: null
  },
  user: ClientUser {
    id: '581252437843902475',
    system: null,
    locale: null,
    flags: null,
    username: 'skillz bot',
    bot: true,
    discriminator: '9925',
    avatar: 'db1ff10c1658c25aa618eea4087149c9',
    lastMessageID: null,
    lastMessageChannelID: null,
    verified: true,
    mfaEnabled: true,
    _typing: Map(0) {}
  },
  readyAt: 2021-02-17T23:17:07.845Z,
  [Symbol(kCapture)]: false
}
*/