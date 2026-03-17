/**
 * 离线词典服务
 * 基于 ECDICT 数据集，提供单词查询、词形还原等功能
 */

import { Database } from './database';

// 常用词列表（前 3000 高频词 - 基础词汇不应被标注）
const COMMON_WORDS = new Set([
  // 功能词 (前100)
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
  'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
  'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'is', 'was', 'are', 'were', 'been', 'has', 'had', 'did', 'does', 'doing', 'done', 'am', 'being', 'having',
  // 基础动词 (101-300)
  'go', 'come', 'take', 'make', 'get', 'see', 'know', 'think', 'say', 'tell', 'give', 'find', 'want', 'use', 'work', 'call', 'try', 'ask', 'need', 'feel',
  'become', 'leave', 'put', 'mean', 'keep', 'let', 'begin', 'seem', 'help', 'show', 'hear', 'play', 'run', 'move', 'live', 'believe', 'bring', 'happen', 'stand', 'lose',
  'pay', 'meet', 'include', 'continue', 'set', 'learn', 'change', 'lead', 'understand', 'watch', 'follow', 'stop', 'create', 'speak', 'read', 'allow', 'add', 'spend', 'grow', 'open',
  'walk', 'offer', 'remember', 'love', 'consider', 'appear', 'buy', 'wait', 'serve', 'die', 'send', 'expect', 'build', 'stay', 'fall', 'cut', 'reach', 'kill', 'remain', 'suggest',
  'raise', 'pass', 'sell', 'require', 'report', 'decide', 'pull', 'return', 'explain', 'carry', 'develop', 'hope', 'drive', 'break', 'receive', 'agree', 'support', 'remove', 'return', 'describe',
  'create', 'add', 'apply', 'avoid', 'prepare', 'compare', 'declare', 'deliver', 'discover', 'encourage', 'ensure', 'establish', 'exist', 'expand', 'express', 'extend', 'face', 'fail', 'fill', 'finish',
  'focus', 'force', 'forget', 'form', 'gain', 'gather', 'handle', 'hang', 'happen', 'head', 'hear', 'help', 'hide', 'hit', 'hold', 'hope', 'hurt', 'identify', 'ignore', 'imagine',
  'improve', 'include', 'increase', 'indicate', 'influence', 'inform', 'insist', 'install', 'intend', 'introduce', 'invite', 'involve', 'join', 'jump', 'keep', 'kick', 'kill', 'kiss', 'knock', 'know',
  'lack', 'last', 'laugh', 'lay', 'lead', 'learn', 'leave', 'lend', 'let', 'lie', 'like', 'limit', 'link', 'listen', 'live', 'look', 'lose', 'love', 'maintain', 'make',
  'manage', 'matter', 'may', 'mean', 'measure', 'meet', 'mention', 'might', 'mind', 'miss', 'move', 'must', 'name', 'need', 'note', 'notice', 'obtain', 'occur', 'offer', 'open',
  'order', 'ought', 'own', 'pass', 'pay', 'perform', 'perhaps', 'pick', 'place', 'plan', 'play', 'point', 'prefer', 'prepare', 'present', 'press', 'prevent', 'produce', 'promise', 'propose',
  'protect', 'prove', 'provide', 'publish', 'pull', 'push', 'put', 'raise', 'reach', 'read', 'realize', 'receive', 'recognize', 'recommend', 'reduce', 'refer', 'reflect', 'refuse', 'regard', 'relate',
  'release', 'remain', 'remember', 'remove', 'repeat', 'replace', 'reply', 'report', 'represent', 'require', 'research', 'rest', 'result', 'return', 'reveal', 'ride', 'ring', 'rise', 'risk', 'roll',
  'run', 'save', 'say', 'see', 'seem', 'sell', 'send', 'serve', 'set', 'settle', 'shake', 'share', 'shift', 'shoot', 'should', 'shout', 'show', 'shut', 'sing', 'sit',
  'sleep', 'slide', 'slip', 'smile', 'sort', 'sound', 'speak', 'spend', 'spread', 'spring', 'stand', 'start', 'state', 'stay', 'steal', 'stick', 'stop', 'stress', 'strike', 'struggle',
  'study', 'submit', 'succeed', 'suffer', 'suggest', 'suit', 'supply', 'support', 'suppose', 'surprise', 'surround', 'survive', 'suspect', 'switch', 'take', 'talk', 'teach', 'tear', 'tell', 'tend',
  'test', 'thank', 'think', 'throw', 'tie', 'touch', 'track', 'trade', 'train', 'transfer', 'travel', 'treat', 'trouble', 'trust', 'try', 'turn', 'twist', 'understand', 'undertake', 'unite',
  'update', 'upgrade', 'upset', 'use', 'used', 'value', 'vary', 'visit', 'voice', 'vote', 'wait', 'wake', 'walk', 'want', 'warn', 'wash', 'watch', 'wave', 'wear', 'wed',
  'weigh', 'welcome', 'whisper', 'win', 'wind', 'wish', 'wonder', 'work', 'worry', 'write', 'wrong', 'yield',
  // 基础名词 (301-600)
  'time', 'way', 'year', 'work', 'government', 'day', 'man', 'world', 'life', 'part', 'number', 'child', 'system', 'case', 'group', 'company', 'problem', 'hand', 'place', 'end',
  'week', 'point', 'question', 'thing', 'eye', 'woman', 'country', 'area', 'person', 'information', 'issue', 'side', 'kind', 'head', 'house', 'service', 'friend', 'father', 'power', 'hour',
  'game', 'line', 'member', 'law', 'car', 'city', 'community', 'name', 'president', 'team', 'minute', 'idea', 'kid', 'body', 'back', 'parent', 'face', 'others', 'level', 'office', 'door',
  'health', 'art', 'war', 'history', 'party', 'result', 'change', 'morning', 'reason', 'research', 'girl', 'guy', 'moment', 'air', 'teacher', 'force', 'education', 'foot', 'boy', 'age',
  'policy', 'everything', 'love', 'process', 'music', 'market', 'sense', 'nation', 'plan', 'college', 'interest', 'death', 'experience', 'effect', 'class', 'control', 'care', 'field', 'development', 'role',
  'effort', 'rate', 'heart', 'drug', 'show', 'leader', 'light', 'voice', 'wife', 'police', 'mind', 'price', 'report', 'decision', 'son', 'view', 'town', 'building', 'blood', 'century',
  'culture', 'billion', 'chance', 'brother', 'energy', 'period', 'course', 'summer', 'plant', 'opportunity', 'term', 'letter', 'condition', 'choice', 'rule', 'daughter', 'administration', 'south', 'husband', 'Congress',
  'floor', 'campaign', 'material', 'population', 'call', 'economy', 'medical', 'hospital', 'church', 'close', 'risk', 'fire', 'future', 'defense', 'security', 'bank', 'west', 'sport', 'board', 'seek',
  'per', 'subject', 'officer', 'private', 'rest', 'behavior', 'deal', 'performance', 'fight', 'throw', 'top', 'quickly', 'past', 'goal', 'second', 'order', 'author', 'represent', 'focus', 'foreign',
  'drop', 'plan', 'blood', 'upon', 'agency', 'push', 'nature', 'color', 'store', 'sound', 'election', 'edge', 'individual', 'pay', 'message', 'please', 'condition', 'comment', 'element', 'finish',
  'model', 'earth', 'design', 'attention', 'growth', 'activity', 'practice', 'piece', 'land', 'product', 'doctor', 'wall', 'patient', 'worker', 'news', 'test', 'movie', 'north', 'love', 'support',
  'technology', 'step', 'baby', 'computer', 'type', 'attention', 'film', 'tree', 'source', 'organization', 'hair', 'look', 'century', 'evidence', 'window', 'difficult', 'listen', 'soon', 'culture', 'billion',
  'chance', 'brother', 'energy', 'period', 'summer', 'plant', 'opportunity', 'term', 'letter', 'choice', 'rule', 'daughter', 'south', 'husband', 'floor', 'campaign', 'material', 'population', 'economy', 'hospital',
  'church', 'close', 'risk', 'future', 'security', 'bank', 'west', 'sport', 'board', 'subject', 'officer', 'private', 'rest', 'behavior', 'deal', 'performance', 'fight', 'throw', 'top', 'goal',
  'author', 'represent', 'focus', 'foreign', 'drop', 'agency', 'push', 'nature', 'color', 'store', 'sound', 'election', 'edge', 'individual', 'pay', 'message', 'comment', 'element', 'model', 'earth',
  'design', 'growth', 'activity', 'practice', 'piece', 'land', 'product', 'doctor', 'wall', 'patient', 'worker', 'news', 'test', 'movie', 'north', 'technology', 'step', 'computer', 'type', 'film', 'tree',
  'source', 'organization', 'hair', 'evidence', 'window', 'difficult', 'culture', 'billion', 'chance', 'brother', 'energy', 'period', 'summer', 'plant', 'opportunity', 'term', 'letter', 'choice', 'rule', 'daughter',
  'south', 'husband', 'floor', 'campaign', 'material', 'population', 'economy', 'hospital', 'church', 'close', 'risk', 'future', 'security', 'bank', 'west', 'sport', 'board', 'subject', 'officer', 'private',
  'rest', 'behavior', 'deal', 'performance', 'fight', 'throw', 'top', 'goal', 'author', 'represent', 'focus', 'foreign', 'drop', 'agency', 'push', 'nature', 'color', 'store', 'sound', 'election',
  'edge', 'individual', 'pay', 'message', 'comment', 'element', 'model', 'earth', 'design', 'growth', 'activity', 'practice', 'piece', 'land', 'product', 'doctor', 'wall', 'patient', 'worker', 'news',
  'test', 'movie', 'north', 'technology', 'step', 'computer', 'type', 'film', 'tree', 'source', 'organization', 'hair', 'evidence', 'window',
  // 基础形容词/副词 (601-800)
  'new', 'good', 'first', 'last', 'long', 'great', 'little', 'own', 'old', 'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early', 'young', 'important', 'few',
  'public', 'bad', 'same', 'able', 'sure', 'clear', 'easy', 'hard', 'early', 'late', 'best', 'better', 'strong', 'whole', 'free', 'true', 'full', 'special', 'recent', 'available',
  'likely', 'certain', 'similar', 'common', 'single', 'major', 'current', 'final', 'short', 'simple', 'past', 'future', 'possible', 'real', 'human', 'local', 'social', 'political', 'national', 'international',
  'economic', 'financial', 'medical', 'military', 'legal', 'environmental', 'cultural', 'historical', 'scientific', 'technical', 'professional', 'personal', 'physical', 'mental', 'emotional', 'spiritual', 'moral', 'ethical', 'practical', 'theoretical',
  'direct', 'indirect', 'general', 'specific', 'particular', 'certain', 'sure', 'clear', 'obvious', 'apparent', 'evident', 'likely', 'possible', 'probable', 'certain', 'necessary', 'essential', 'important', 'significant', 'crucial',
  'critical', 'vital', 'basic', 'fundamental', 'primary', 'secondary', 'main', 'major', 'minor', 'key', 'central', 'core', 'outer', 'inner', 'upper', 'lower', 'front', 'back', 'top', 'bottom',
  'high', 'low', 'deep', 'shallow', 'wide', 'narrow', 'thick', 'thin', 'heavy', 'light', 'strong', 'weak', 'hard', 'soft', 'smooth', 'rough', 'sharp', 'blunt', 'bright', 'dark',
  'light', 'heavy', 'hot', 'cold', 'warm', 'cool', 'dry', 'wet', 'clean', 'dirty', 'fresh', 'stale', 'sweet', 'sour', 'bitter', 'salty', 'loud', 'quiet', 'noisy', 'silent',
  'fast', 'slow', 'quick', 'rapid', 'swift', 'speedy', 'gradual', 'sudden', 'immediate', 'instant', 'early', 'late', 'punctual', 'timely', 'untimely', 'regular', 'irregular', 'frequent', 'infrequent', 'rare',
  'common', 'uncommon', 'usual', 'unusual', 'normal', 'abnormal', 'ordinary', 'extraordinary', 'average', 'typical', 'atypical', 'standard', 'nonstandard', 'conventional', 'unconventional', 'traditional', 'modern', 'old', 'new', 'ancient',
  'recent', 'current', 'present', 'past', 'future', 'former', 'latter', 'first', 'last', 'initial', 'final', 'original', 'copy', 'fake', 'real', 'true', 'false', 'correct', 'incorrect', 'right',
  'wrong', 'accurate', 'inaccurate', 'precise', 'imprecise', 'exact', 'inexact', 'specific', 'general', 'vague', 'clear', 'unclear', 'obvious', 'subtle', 'visible', 'invisible', 'apparent', 'hidden', 'open', 'closed',
  'public', 'private', 'personal', 'professional', 'official', 'unofficial', 'formal', 'informal', 'casual', 'serious', 'funny', 'humorous', 'sad', 'happy', 'cheerful', 'joyful', 'delighted', 'pleased', 'satisfied', 'content',
  'disappointed', 'frustrated', 'annoyed', 'irritated', 'angry', 'furious', 'mad', 'calm', 'peaceful', 'quiet', 'silent', 'noisy', 'loud', 'active', 'inactive', 'busy', 'idle', 'lazy', 'hardworking', 'diligent',
  'careful', 'careless', 'cautious', 'reckless', 'safe', 'dangerous', 'risky', 'secure', 'insecure', 'stable', 'unstable', 'steady', 'unsteady', 'firm', 'loose', 'tight', 'strict', 'lenient', 'severe', 'mild',
  'kind', 'cruel', 'friendly', 'unfriendly', 'polite', 'rude', 'respectful', 'disrespectful', 'honest', 'dishonest', 'sincere', 'insincere', 'genuine', 'fake', 'authentic', 'false', 'true', 'loyal', 'disloyal', 'faithful',
  'unfaithful', 'trustworthy', 'untrustworthy', 'reliable', 'unreliable', 'dependable', 'undependable', 'responsible', 'irresponsible', 'mature', 'immature', 'sensible', 'foolish', 'wise', 'unwise', 'smart', 'intelligent', 'clever', 'stupid', 'silly',
  'ridiculous', 'absurd', 'reasonable', 'unreasonable', 'logical', 'illogical', 'rational', 'irrational', 'sane', 'insane', 'conscious', 'unconscious', 'aware', 'unaware', 'alert', 'asleep', 'awake', 'tired', 'energetic', 'lively',
  'active', 'passive', 'positive', 'negative', 'optimistic', 'pessimistic', 'realistic', 'idealistic', 'practical', 'impractical', 'theoretical', 'applied', 'abstract', 'concrete', 'physical', 'mental', 'spiritual', 'emotional', 'intellectual', 'academic'
]);

// 短单词过滤列表（长度<=3 通常是基础词汇）
const SHORT_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his',
  'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'dad', 'mom',
  'act', 'add', 'age', 'ago', 'aid', 'air', 'all', 'any', 'arm', 'art', 'ask', 'bad', 'bag', 'bar', 'bat', 'bed', 'bet', 'bid', 'big', 'bit',
  'box', 'bug', 'bus', 'buy', 'car', 'cat', 'cop', 'cow', 'cry', 'cup', 'cut', 'dog', 'dry', 'due', 'eat', 'egg', 'end', 'eye', 'fan', 'far',
  'fat', 'fee', 'few', 'fit', 'fix', 'fly', 'fun', 'gap', 'gas', 'gay', 'get', 'god', 'got', 'gun', 'guy', 'gym', 'hat', 'hay', 'hit', 'hot',
  'hug', 'hut', 'ice', 'ill', 'ink', 'inn', 'jam', 'jar', 'jaw', 'jet', 'job', 'joy', 'key', 'kid', 'kit', 'lab', 'lap', 'law', 'lay', 'leg',
  'lid', 'lie', 'lip', 'log', 'lot', 'low', 'mad', 'map', 'mat', 'may', 'mix', 'mud', 'mug', 'nap', 'net', 'nod', 'nor', 'now', 'nut', 'oak',
  'odd', 'off', 'oil', 'one', 'own', 'pad', 'pan', 'par', 'pat', 'pay', 'pea', 'pen', 'pet', 'pie', 'pig', 'pin', 'pit', 'pot', 'pro', 'pub',
  'put', 'rag', 'ram', 'ran', 'rap', 'rat', 'raw', 'ray', 'red', 'rib', 'rid', 'rig', 'rim', 'rip', 'rob', 'rod', 'row', 'rub', 'rug', 'run',
  'sad', 'sat', 'saw', 'sea', 'set', 'sew', 'sex', 'shy', 'sin', 'sip', 'sir', 'sit', 'six', 'ski', 'sky', 'sly', 'son', 'soy', 'spa', 'spy',
  'sum', 'sun', 'tab', 'tag', 'tan', 'tap', 'tax', 'tea', 'ten', 'the', 'tie', 'tin', 'tip', 'toe', 'ton', 'too', 'top', 'tow', 'toy', 'try',
  'tub', 'tug', 'two', 'use', 'van', 'vet', 'via', 'war', 'was', 'wax', 'way', 'web', 'wed', 'wet', 'who', 'why', 'win', 'wit', 'won', 'wow',
  'yes', 'yet', 'you', 'zip', 'zoo'
]);

// 基础词典数据（实际应用中应该从本地文件加载）
const BASE_DICT: Record<string, { definition: string; phonetic?: string }> = {
  'abandon': { definition: 'v. 放弃，抛弃', phonetic: '/əˈbændən/' },
  'ability': { definition: 'n. 能力，才能', phonetic: '/əˈbɪləti/' },
  'able': { definition: 'adj. 能够的，有能力的', phonetic: '/ˈeɪbl/' },
  'about': { definition: 'prep. 关于，大约', phonetic: '/əˈbaʊt/' },
  'above': { definition: 'prep. 在...之上', phonetic: '/əˈbʌv/' },
  'accept': { definition: 'v. 接受，认可', phonetic: '/əkˈsept/' },
  'accident': { definition: 'n. 事故，意外', phonetic: '/ˈæksɪdənt/' },
  'according': { definition: 'adv. 根据，按照', phonetic: '/əˈkɔːrdɪŋ/' },
  'account': { definition: 'n. 账户，解释', phonetic: '/əˈkaʊnt/' },
  'achieve': { definition: 'v. 达到，实现', phonetic: '/əˈtʃiːv/' },
  'across': { definition: 'prep. 横过，穿过', phonetic: '/əˈkrɔːs/' },
  'action': { definition: 'n. 行动，行为', phonetic: '/ˈækʃn/' },
  'activity': { definition: 'n. 活动，活跃', phonetic: '/ækˈtɪvəti/' },
  'actually': { definition: 'adv. 实际上，事实上', phonetic: '/ˈæktʃuəli/' },
  'add': { definition: 'v. 添加，增加', phonetic: '/æd/' },
  'address': { definition: 'n. 地址，演讲', phonetic: '/əˈdres/' },
  'administration': { definition: 'n. 管理，行政部门', phonetic: '/ədˌmɪnɪˈstreɪʃn/' },
  'admit': { definition: 'v. 承认，准许进入', phonetic: '/ədˈmɪt/' },
  'adult': { definition: 'n. 成年人', phonetic: '/ˈædʌlt/' },
  'affect': { definition: 'v. 影响，感动', phonetic: '/əˈfekt/' },
  'after': { definition: 'prep. 在...之后', phonetic: '/ˈæftər/' },
  'again': { definition: 'adv. 再一次', phonetic: '/əˈɡen/' },
  'against': { definition: 'prep. 反对，靠着', phonetic: '/əˈɡenst/' },
  'age': { definition: 'n. 年龄，时代', phonetic: '/eɪdʒ/' },
  'agency': { definition: 'n. 代理，代理处', phonetic: '/ˈeɪdʒənsi/' },
  'agent': { definition: 'n. 代理人，特工', phonetic: '/ˈeɪdʒənt/' },
  'ago': { definition: 'adv. 以前', phonetic: '/əˈɡoʊ/' },
  'agree': { definition: 'v. 同意，赞成', phonetic: '/əˈɡriː/' },
  'agreement': { definition: 'n. 协议，同意', phonetic: '/əˈɡriːmənt/' },
  'ahead': { definition: 'adv. 向前，提前', phonetic: '/əˈhed/' },
  'air': { definition: 'n. 空气，空中', phonetic: '/er/' },
  'all': { definition: 'adj. 所有的', phonetic: '/ɔːl/' },
  'allow': { definition: 'v. 允许，准许', phonetic: '/əˈlaʊ/' },
  'almost': { definition: 'adv. 几乎，差不多', phonetic: '/ˈɔːlmoʊst/' },
  'alone': { definition: 'adj. 单独的', phonetic: '/əˈloʊn/' },
  'along': { definition: 'prep. 沿着', phonetic: '/əˈlɔːŋ/' },
  'already': { definition: 'adv. 已经', phonetic: '/ɔːlˈredi/' },
  'also': { definition: 'adv. 也，同样', phonetic: '/ˈɔːlsoʊ/' },
  'although': { definition: 'conj. 虽然，尽管', phonetic: '/ɔːlˈðoʊ/' },
  'always': { definition: 'adv. 总是', phonetic: '/ˈɔːlweɪz/' },
  'am': { definition: 'v. 是', phonetic: '/æm/' },
  'among': { definition: 'prep. 在...之中', phonetic: '/əˈmʌŋ/' },
  'amount': { definition: 'n. 数量，总额', phonetic: '/əˈmaʊnt/' },
  'an': { definition: 'art. 一个', phonetic: '/æn/' },
  'analysis': { definition: 'n. 分析', phonetic: '/əˈnæləsɪs/' },
  'and': { definition: 'conj. 和', phonetic: '/ænd/' },
  'animal': { definition: 'n. 动物', phonetic: '/ˈænɪml/' },
  'another': { definition: 'adj. 另一个', phonetic: '/əˈnʌðər/' },
  'answer': { definition: 'n. 答案', phonetic: '/ˈænsər/' },
  'any': { definition: 'pron. 任何', phonetic: '/ˈeni/' },
  'anyone': { definition: 'pron. 任何人', phonetic: '/ˈeniwʌn/' },
  'anything': { definition: 'pron. 任何事', phonetic: '/ˈeniθɪŋ/' },
  'appear': { definition: 'v. 出现，似乎', phonetic: '/əˈpɪr/' },
  'apply': { definition: 'v. 申请，应用', phonetic: '/əˈplaɪ/' },
  'approach': { definition: 'n. 方法，接近', phonetic: '/əˈproʊtʃ/' },
  'area': { definition: 'n. 地区，面积', phonetic: '/ˈeriə/' },
  'argue': { definition: 'v. 争论，主张', phonetic: '/ˈɑːrɡjuː/' },
  'arm': { definition: 'n. 手臂', phonetic: '/ɑːrm/' },
  'around': { definition: 'prep. 在...周围', phonetic: '/əˈraʊnd/' },
  'arrive': { definition: 'v. 到达', phonetic: '/əˈraɪv/' },
  'art': { definition: 'n. 艺术', phonetic: '/ɑːrt/' },
  'article': { definition: 'n. 文章，物品', phonetic: '/ˈɑːrtɪkl/' },
  'artist': { definition: 'n. 艺术家', phonetic: '/ˈɑːrtɪst/' },
  'as': { definition: 'conj. 如同', phonetic: '/æz/' },
  'ask': { definition: 'v. 问，请求', phonetic: '/ɑːsk/' },
  'assume': { definition: 'v. 假设，承担', phonetic: '/əˈsuːm/' },
  'at': { definition: 'prep. 在', phonetic: '/æt/' },
  'attack': { definition: 'v. 攻击', phonetic: '/əˈtæk/' },
  'attention': { definition: 'n. 注意', phonetic: '/əˈtenʃn/' },
  'attorney': { definition: 'n. 律师', phonetic: '/əˈtɜːrni/' },
  'audience': { definition: 'n. 观众', phonetic: '/ˈɔːdiəns/' },
  'author': { definition: 'n. 作者', phonetic: '/ˈɔːθər/' },
  'authority': { definition: 'n. 权威，当局', phonetic: '/əˈθɔːrəti/' },
  'available': { definition: 'adj. 可用的', phonetic: '/əˈveɪləbl/' },
  'avoid': { definition: 'v. 避免', phonetic: '/əˈvɔɪd/' },
  'away': { definition: 'adv. 离开', phonetic: '/əˈweɪ/' },
  'baby': { definition: 'n. 婴儿', phonetic: '/ˈbeɪbi/' },
  'back': { definition: 'adv. 向后', phonetic: '/bæk/' },
  'bad': { definition: 'adj. 坏的', phonetic: '/bæd/' },
  'bag': { definition: 'n. 包', phonetic: '/bæɡ/' },
  'ball': { definition: 'n. 球', phonetic: '/bɔːl/' },
  'bank': { definition: 'n. 银行', phonetic: '/bæŋk/' },
  'bar': { definition: 'n. 酒吧', phonetic: '/bɑːr/' },
  'base': { definition: 'n. 基础', phonetic: '/beɪs/' },
  'be': { definition: 'v. 是', phonetic: '/biː/' },
  'beat': { definition: 'v. 打败', phonetic: '/biːt/' },
  'beautiful': { definition: 'adj. 美丽的', phonetic: '/ˈbjuːtɪfl/' },
  'because': { definition: 'conj. 因为', phonetic: '/bɪˈkɔːz/' },
  'become': { definition: 'v. 变成', phonetic: '/bɪˈkʌm/' },
  'bed': { definition: 'n. 床', phonetic: '/bed/' },
  'before': { definition: 'prep. 在...之前', phonetic: '/bɪˈfɔːr/' },
  'begin': { definition: 'v. 开始', phonetic: '/bɪˈɡɪn/' },
  'behavior': { definition: 'n. 行为', phonetic: '/bɪˈheɪvjər/' },
  'behind': { definition: 'prep. 在...后面', phonetic: '/bɪˈhaɪnd/' },
  'believe': { definition: 'v. 相信', phonetic: '/bɪˈliːv/' },
  'benefit': { definition: 'n. 利益', phonetic: '/ˈbenɪfɪt/' },
  'best': { definition: 'adj. 最好的', phonetic: '/best/' },
  'better': { definition: 'adj. 更好的', phonetic: '/ˈbetər/' },
  'between': { definition: 'prep. 在...之间', phonetic: '/bɪˈtwiːn/' },
  'beyond': { definition: 'prep. 超过', phonetic: '/bɪˈjɑːnd/' },
  'big': { definition: 'adj. 大的', phonetic: '/bɪɡ/' },
  'bill': { definition: 'n. 账单', phonetic: '/bɪl/' },
  'billion': { definition: 'num. 十亿', phonetic: '/ˈbɪljən/' },
  'bit': { definition: 'n. 一点', phonetic: '/bɪt/' },
  'black': { definition: 'adj. 黑色的', phonetic: '/blæk/' },
  'blood': { definition: 'n. 血', phonetic: '/blʌd/' },
  'blue': { definition: 'adj. 蓝色的', phonetic: '/bluː/' },
  'board': { definition: 'n. 板', phonetic: '/bɔːrd/' },
  'body': { definition: 'n. 身体', phonetic: '/ˈbɑːdi/' },
  'book': { definition: 'n. 书', phonetic: '/bʊk/' },
  'born': { definition: 'adj. 出生的', phonetic: '/bɔːrn/' },
  'both': { definition: 'pron. 两者都', phonetic: '/boʊθ/' },
  'box': { definition: 'n. 盒子', phonetic: '/bɑːks/' },
  'boy': { definition: 'n. 男孩', phonetic: '/bɔɪ/' },
  'brain': { definition: 'n. 大脑', phonetic: '/breɪn/' },
  'break': { definition: 'v. 打破', phonetic: '/breɪk/' },
  'bring': { definition: 'v. 带来', phonetic: '/brɪŋ/' },
  'brother': { definition: 'n. 兄弟', phonetic: '/ˈbrʌðər/' },
  'budget': { definition: 'n. 预算', phonetic: '/ˈbʌdʒɪt/' },
  'build': { definition: 'v. 建造', phonetic: '/bɪld/' },
  'building': { definition: 'n. 建筑物', phonetic: '/ˈbɪldɪŋ/' },
  'business': { definition: 'n. 商业', phonetic: '/ˈbɪznəs/' },
  'but': { definition: 'conj. 但是', phonetic: '/bʌt/' },
  'buy': { definition: 'v. 买', phonetic: '/baɪ/' },
  'by': { definition: 'prep. 通过', phonetic: '/baɪ/' },
  'call': { definition: 'v. 打电话', phonetic: '/kɔːl/' },
  'camera': { definition: 'n. 相机', phonetic: '/ˈkæmərə/' },
  'campaign': { definition: 'n. 运动', phonetic: '/kæmˈpeɪn/' },
  'can': { definition: 'v. 能', phonetic: '/kæn/' },
  'cancer': { definition: 'n. 癌症', phonetic: '/ˈkænsər/' },
  'candidate': { definition: 'n. 候选人', phonetic: '/ˈkændɪdət/' },
  'capital': { definition: 'n. 首都', phonetic: '/ˈkæpɪtl/' },
  'car': { definition: 'n. 汽车', phonetic: '/kɑːr/' },
  'card': { definition: 'n. 卡片', phonetic: '/kɑːrd/' },
  'care': { definition: 'n. 关心', phonetic: '/ker/' },
  'career': { definition: 'n. 职业', phonetic: '/kəˈrɪr/' },
  'carry': { definition: 'v. 携带', phonetic: '/ˈkæri/' },
  'case': { definition: 'n. 情况', phonetic: '/keɪs/' },
  'catch': { definition: 'v. 抓住', phonetic: '/kætʃ/' },
  'cause': { definition: 'n. 原因', phonetic: '/kɔːz/' },
  'cell': { definition: 'n. 细胞', phonetic: '/sel/' },
  'center': { definition: 'n. 中心', phonetic: '/ˈsentər/' },
  'central': { definition: 'adj. 中央的', phonetic: '/ˈsentrəl/' },
  'century': { definition: 'n. 世纪', phonetic: '/ˈsentʃəri/' },
  'certain': { definition: 'adj. 确定的', phonetic: '/ˈsɜːrtn/' },
  'certainly': { definition: 'adv. 当然', phonetic: '/ˈsɜːrtnli/' },
  'chair': { definition: 'n. 椅子', phonetic: '/tʃer/' },
  'challenge': { definition: 'n. 挑战', phonetic: '/ˈtʃælɪndʒ/' },
  'chance': { definition: 'n. 机会', phonetic: '/tʃæns/' },
  'change': { definition: 'v. 改变', phonetic: '/tʃeɪndʒ/' },
  'character': { definition: 'n. 性格', phonetic: '/ˈkærəktər/' },
  'charge': { definition: 'v. 收费', phonetic: '/tʃɑːrdʒ/' },
  'check': { definition: 'v. 检查', phonetic: '/tʃek/' },
  'child': { definition: 'n. 孩子', phonetic: '/tʃaɪld/' },
  'choice': { definition: 'n. 选择', phonetic: '/tʃɔɪs/' },
  'choose': { definition: 'v. 选择', phonetic: '/tʃuːz/' },
  'church': { definition: 'n. 教堂', phonetic: '/tʃɜːrtʃ/' },
  'citizen': { definition: 'n. 公民', phonetic: '/ˈsɪtɪzn/' },
  'city': { definition: 'n. 城市', phonetic: '/ˈsɪti/' },
  'civil': { definition: 'adj. 公民的', phonetic: '/ˈsɪvl/' },
  'claim': { definition: 'v. 声称', phonetic: '/kleɪm/' },
  'class': { definition: 'n. 班级', phonetic: '/klæs/' },
  'clear': { definition: 'adj. 清楚的', phonetic: '/klɪr/' },
  'clearly': { definition: 'adv. 清楚地', phonetic: '/ˈklɪrli/' },
  'close': { definition: 'v. 关闭', phonetic: '/kloʊz/' },
  'coach': { definition: 'n. 教练', phonetic: '/koʊtʃ/' },
  'cold': { definition: 'adj. 冷的', phonetic: '/koʊld/' },
  'collection': { definition: 'n. 收集', phonetic: '/kəˈlekʃn/' },
  'college': { definition: 'n. 大学', phonetic: '/ˈkɑːlɪdʒ/' },
  'color': { definition: 'n. 颜色', phonetic: '/ˈkʌlər/' },
  'come': { definition: 'v. 来', phonetic: '/kʌm/' },
  'commercial': { definition: 'adj. 商业的', phonetic: '/kəˈmɜːrʃl/' },
  'common': { definition: 'adj. 共同的', phonetic: '/ˈkɑːmən/' },
  'community': { definition: 'n. 社区', phonetic: '/kəˈmjuːnəti/' },
  'company': { definition: 'n. 公司', phonetic: '/ˈkʌmpəni/' },
  'compare': { definition: 'v. 比较', phonetic: '/kəmˈper/' },
  'computer': { definition: 'n. 计算机', phonetic: '/kəmˈpjuːtər/' },
  'concern': { definition: 'n. 关心', phonetic: '/kənˈsɜːrn/' },
  'condition': { definition: 'n. 条件', phonetic: '/kənˈdɪʃn/' },
  'conference': { definition: 'n. 会议', phonetic: '/ˈkɑːnfərəns/' },
  'congress': { definition: 'n. 国会', phonetic: '/ˈkɑːŋɡrəs/' },
  'consider': { definition: 'v. 考虑', phonetic: '/kənˈsɪdər/' },
  'consumer': { definition: 'n. 消费者', phonetic: '/kənˈsuːmər/' },
  'contain': { definition: 'v. 包含', phonetic: '/kənˈteɪn/' },
  'continue': { definition: 'v. 继续', phonetic: '/kənˈtɪnjuː/' },
  'control': { definition: 'v. 控制', phonetic: '/kənˈtroʊl/' },
  'cost': { definition: 'n. 成本', phonetic: '/kɔːst/' },
  'could': { definition: 'v. 能', phonetic: '/kʊd/' },
  'country': { definition: 'n. 国家', phonetic: '/ˈkʌntri/' },
  'couple': { definition: 'n. 夫妇', phonetic: '/ˈkʌpl/' },
  'course': { definition: 'n. 课程', phonetic: '/kɔːrs/' },
  'court': { definition: 'n. 法庭', phonetic: '/kɔːrt/' },
  'cover': { definition: 'v. 覆盖', phonetic: '/ˈkʌvər/' },
  'create': { definition: 'v. 创造', phonetic: '/kriˈeɪt/' },
  'crime': { definition: 'n. 犯罪', phonetic: '/kraɪm/' },
  'cultural': { definition: 'adj. 文化的', phonetic: '/ˈkʌltʃərəl/' },
  'culture': { definition: 'n. 文化', phonetic: '/ˈkʌltʃər/' },
  'cup': { definition: 'n. 杯子', phonetic: '/kʌp/' },
  'current': { definition: 'adj. 当前的', phonetic: '/ˈkɜːrənt/' },
  'customer': { definition: 'n. 顾客', phonetic: '/ˈkʌstəmər/' },
  'cut': { definition: 'v. 切', phonetic: '/kʌt/' },
  'dark': { definition: 'adj. 黑暗的', phonetic: '/dɑːrk/' },
  'data': { definition: 'n. 数据', phonetic: '/ˈdeɪtə/' },
  'daughter': { definition: 'n. 女儿', phonetic: '/ˈdɔːtər/' },
  'day': { definition: 'n. 天', phonetic: '/deɪ/' },
  'dead': { definition: 'adj. 死的', phonetic: '/ded/' },
  'deal': { definition: 'n. 交易', phonetic: '/diːl/' },
  'death': { definition: 'n. 死亡', phonetic: '/deθ/' },
  'debate': { definition: 'n. 辩论', phonetic: '/dɪˈbeɪt/' },
  'decade': { definition: 'n. 十年', phonetic: '/ˈdekeɪd/' },
  'decide': { definition: 'v. 决定', phonetic: '/dɪˈsaɪd/' },
  'decision': { definition: 'n. 决定', phonetic: '/dɪˈsɪʒn/' },
  'deep': { definition: 'adj. 深的', phonetic: '/diːp/' },
  'defense': { definition: 'n. 防御', phonetic: '/dɪˈfens/' },
  'degree': { definition: 'n. 程度', phonetic: '/dɪˈɡriː/' },
  'democrat': { definition: 'n. 民主党人', phonetic: '/ˈdeməkræt/' },
  'democratic': { definition: 'adj. 民主的', phonetic: '/ˌdeməˈkrætɪk/' },
  'describe': { definition: 'v. 描述', phonetic: '/dɪˈskraɪb/' },
  'design': { definition: 'v. 设计', phonetic: '/dɪˈzaɪn/' },
  'despite': { definition: 'prep. 尽管', phonetic: '/dɪˈspaɪt/' },
  'detail': { definition: 'n. 细节', phonetic: '/ˈdiːteɪl/' },
  'determine': { definition: 'v. 决定', phonetic: '/dɪˈtɜːrmɪn/' },
  'develop': { definition: 'v. 发展', phonetic: '/dɪˈveləp/' },
  'development': { definition: 'n. 发展', phonetic: '/dɪˈveləpmənt/' },
  'die': { definition: 'v. 死', phonetic: '/daɪ/' },
  'difference': { definition: 'n. 差异', phonetic: '/ˈdɪfrəns/' },
  'different': { definition: 'adj. 不同的', phonetic: '/ˈdɪfrənt/' },
  'difficult': { definition: 'adj. 困难的', phonetic: '/ˈdɪfɪkəlt/' },
  'dinner': { definition: 'n. 晚餐', phonetic: '/ˈdɪnər/' },
  'direction': { definition: 'n. 方向', phonetic: '/dəˈrekʃn/' },
  'director': { definition: 'n. 导演', phonetic: '/dəˈrektər/' },
  'discover': { definition: 'v. 发现', phonetic: '/dɪˈskʌvər/' },
  'discuss': { definition: 'v. 讨论', phonetic: '/dɪˈskʌs/' },
  'discussion': { definition: 'n. 讨论', phonetic: '/dɪˈskʌʃn/' },
  'disease': { definition: 'n. 疾病', phonetic: '/dɪˈziːz/' },
  'do': { definition: 'v. 做', phonetic: '/duː/' },
  'doctor': { definition: 'n. 医生', phonetic: '/ˈdɑːktər/' },
  'dog': { definition: 'n. 狗', phonetic: '/dɔːɡ/' },
  'door': { definition: 'n. 门', phonetic: '/dɔːr/' },
  'down': { definition: 'adv. 向下', phonetic: '/daʊn/' },
  'draw': { definition: 'v. 画', phonetic: '/drɔː/' },
  'dream': { definition: 'n. 梦', phonetic: '/driːm/' },
  'drive': { definition: 'v. 驾驶', phonetic: '/draɪv/' },
  'drop': { definition: 'v. 下降', phonetic: '/drɑːp/' },
  'drug': { definition: 'n. 药物', phonetic: '/drʌɡ/' },
  'during': { definition: 'prep. 在...期间', phonetic: '/ˈdjʊərɪŋ/' },
  'each': { definition: 'adj. 每个', phonetic: '/iːtʃ/' },
  'early': { definition: 'adv. 早', phonetic: '/ˈɜːrli/' },
  'east': { definition: 'n. 东', phonetic: '/iːst/' },
  'easy': { definition: 'adj. 容易的', phonetic: '/ˈiːzi/' },
  'eat': { definition: 'v. 吃', phonetic: '/iːt/' },
  'economic': { definition: 'adj. 经济的', phonetic: '/ˌiːkəˈnɑːmɪk/' },
  'economy': { definition: 'n. 经济', phonetic: '/ɪˈkɑːnəmi/' },
  'edge': { definition: 'n. 边缘', phonetic: '/edʒ/' },
  'education': { definition: 'n. 教育', phonetic: '/ˌedʒuˈkeɪʃn/' },
  'effect': { definition: 'n. 影响', phonetic: '/ɪˈfekt/' },
  'effort': { definition: 'n. 努力', phonetic: '/ˈefərt/' },
  'eight': { definition: 'num. 八', phonetic: '/eɪt/' },
  'either': { definition: 'conj. 要么', phonetic: '/ˈaɪðər/' },
  'election': { definition: 'n. 选举', phonetic: '/ɪˈlekʃn/' },
  'else': { definition: 'adv. 其他', phonetic: '/els/' },
  'employee': { definition: 'n. 雇员', phonetic: '/ɪmˈplɔɪiː/' },
  'end': { definition: 'n. 结束', phonetic: '/end/' },
  'energy': { definition: 'n. 能量', phonetic: '/ˈenərdʒi/' },
  'enjoy': { definition: 'v. 享受', phonetic: '/ɪnˈdʒɔɪ/' },
  'enough': { definition: 'adj. 足够的', phonetic: '/ɪˈnʌf/' },
  'enter': { definition: 'v. 进入', phonetic: '/ˈentər/' },
  'entire': { definition: 'adj. 整个的', phonetic: '/ɪnˈtaɪər/' },
  'environment': { definition: 'n. 环境', phonetic: '/ɪnˈvaɪrənmənt/' },
  'environmental': { definition: 'adj. 环境的', phonetic: '/ɪnˌvaɪrənˈmentl/' },
  'especially': { definition: 'adv. 尤其', phonetic: '/ɪˈspeʃəli/' },
  'establish': { definition: 'v. 建立', phonetic: '/ɪˈstæblɪʃ/' },
  'even': { definition: 'adv. 甚至', phonetic: '/ˈiːvn/' },
  'evening': { definition: 'n. 晚上', phonetic: '/ˈiːvnɪŋ/' },
  'event': { definition: 'n. 事件', phonetic: '/ɪˈvent/' },
  'ever': { definition: 'adv. 曾经', phonetic: '/ˈevər/' },
  'every': { definition: 'adj. 每个', phonetic: '/ˈevri/' },
  'everybody': { definition: 'pron. 每个人', phonetic: '/ˈevribɑːdi/' },
  'everyone': { definition: 'pron. 每个人', phonetic: '/ˈevriwʌn/' },
  'everything': { definition: 'pron. 每件事', phonetic: '/ˈevriθɪŋ/' },
  'evidence': { definition: 'n. 证据', phonetic: '/ˈevɪdəns/' },
  'exactly': { definition: 'adv. 确切地', phonetic: '/ɪɡˈzæktli/' },
  'example': { definition: 'n. 例子', phonetic: '/ɪɡˈzæmpl/' },
  'executive': { definition: 'n. 主管', phonetic: '/ɪɡˈzekjətɪv/' },
  'exist': { definition: 'v. 存在', phonetic: '/ɪɡˈzɪst/' },
  'expect': { definition: 'v. 期望', phonetic: '/ɪkˈspekt/' },
  'experience': { definition: 'n. 经验', phonetic: '/ɪkˈspɪriəns/' },
  'expert': { definition: 'n. 专家', phonetic: '/ˈekspɜːrt/' },
  'explain': { definition: 'v. 解释', phonetic: '/ɪkˈspleɪn/' },
  'express': { definition: 'v. 表达', phonetic: '/ɪkˈspres/' },
  'extend': { definition: 'v. 延伸', phonetic: '/ɪkˈstend/' },
  'face': { definition: 'n. 脸', phonetic: '/feɪs/' },
  'fact': { definition: 'n. 事实', phonetic: '/fækt/' },
  'factor': { definition: 'n. 因素', phonetic: '/ˈfæktər/' },
  'fail': { definition: 'v. 失败', phonetic: '/feɪl/' },
  'fall': { definition: 'v. 落下', phonetic: '/fɔːl/' },
  'family': { definition: 'n. 家庭', phonetic: '/ˈfæməli/' },
  'far': { definition: 'adv. 远', phonetic: '/fɑːr/' },
  'fast': { definition: 'adj. 快的', phonetic: '/fæst/' },
  'father': { definition: 'n. 父亲', phonetic: '/ˈfɑːðər/' },
  'fear': { definition: 'n. 恐惧', phonetic: '/fɪr/' },
  'federal': { definition: 'adj. 联邦的', phonetic: '/ˈfedərəl/' },
  'feel': { definition: 'v. 感觉', phonetic: '/fiːl/' },
  'feeling': { definition: 'n. 感觉', phonetic: '/ˈfiːlɪŋ/' },
  'few': { definition: 'adj. 很少的', phonetic: '/fjuː/' },
  'field': { definition: 'n. 领域', phonetic: '/fiːld/' },
  'fight': { definition: 'v. 战斗', phonetic: '/faɪt/' },
  'figure': { definition: 'n. 数字', phonetic: '/ˈfɪɡjər/' },
  'fill': { definition: 'v. 填满', phonetic: '/fɪl/' },
  'film': { definition: 'n. 电影', phonetic: '/fɪlm/' },
  'final': { definition: 'adj. 最终的', phonetic: '/ˈfaɪnl/' },
  'finally': { definition: 'adv. 最后', phonetic: '/ˈfaɪnəli/' },
  'financial': { definition: 'adj. 金融的', phonetic: '/fəˈnænʃl/' },
  'find': { definition: 'v. 找到', phonetic: '/faɪnd/' },
  'fine': { definition: 'adj. 好的', phonetic: '/faɪn/' },
  'finger': { definition: 'n. 手指', phonetic: '/ˈfɪŋɡər/' },
  'finish': { definition: 'v. 完成', phonetic: '/ˈfɪnɪʃ/' },
  'fire': { definition: 'n. 火', phonetic: '/ˈfaɪər/' },
  'firm': { definition: 'n. 公司', phonetic: '/fɜːrm/' },
  'first': { definition: 'adj. 第一的', phonetic: '/fɜːrst/' },
  'fish': { definition: 'n. 鱼', phonetic: '/fɪʃ/' },
  'five': { definition: 'num. 五', phonetic: '/faɪv/' },
  'floor': { definition: 'n. 地板', phonetic: '/flɔːr/' },
  'fly': { definition: 'v. 飞', phonetic: '/flaɪ/' },
  'focus': { definition: 'v. 集中', phonetic: '/ˈfoʊkəs/' },
  'follow': { definition: 'v. 跟随', phonetic: '/ˈfɑːloʊ/' },
  'food': { definition: 'n. 食物', phonetic: '/fuːd/' },
  'foot': { definition: 'n. 脚', phonetic: '/fʊt/' },
  'for': { definition: 'prep. 为了', phonetic: '/fɔːr/' },
  'force': { definition: 'n. 力量', phonetic: '/fɔːrs/' },
  'foreign': { definition: 'adj. 外国的', phonetic: '/ˈfɔːrən/' },
  'forget': { definition: 'v. 忘记', phonetic: '/fərˈɡet/' },
  'form': { definition: 'n. 形式', phonetic: '/fɔːrm/' },
  'former': { definition: 'adj. 以前的', phonetic: '/ˈfɔːrmər/' },
  'forward': { definition: 'adv. 向前', phonetic: '/ˈfɔːrwərd/' },
  'four': { definition: 'num. 四', phonetic: '/fɔːr/' },
  'free': { definition: 'adj. 自由的', phonetic: '/friː/' },
  'friend': { definition: 'n. 朋友', phonetic: '/frend/' },
  'from': { definition: 'prep. 从', phonetic: '/frɑːm/' },
  'front': { definition: 'n. 前面', phonetic: '/frʌnt/' },
  'full': { definition: 'adj. 满的', phonetic: '/fʊl/' },
  'fund': { definition: 'n. 基金', phonetic: '/fʌnd/' },
  'future': { definition: 'n. 未来', phonetic: '/ˈfjuːtʃər/' },
  'game': { definition: 'n. 游戏', phonetic: '/ɡeɪm/' },
  'garden': { definition: 'n. 花园', phonetic: '/ˈɡɑːrdn/' },
  'gas': { definition: 'n. 气体', phonetic: '/ɡæs/' },
  'general': { definition: 'adj. 一般的', phonetic: '/ˈdʒenrəl/' },
  'generation': { definition: 'n. 一代', phonetic: '/ˌdʒenəˈreɪʃn/' },
  'get': { definition: 'v. 得到', phonetic: '/ɡet/' },
  'girl': { definition: 'n. 女孩', phonetic: '/ɡɜːrl/' },
  'give': { definition: 'v. 给', phonetic: '/ɡɪv/' },
  'glass': { definition: 'n. 玻璃', phonetic: '/ɡlæs/' },
  'go': { definition: 'v. 去', phonetic: '/ɡoʊ/' },
  'goal': { definition: 'n. 目标', phonetic: '/ɡoʊl/' },
  'god': { definition: 'n. 上帝', phonetic: '/ɡɑːd/' },
  'gold': { definition: 'n. 金', phonetic: '/ɡoʊld/' },
  'good': { definition: 'adj. 好的', phonetic: '/ɡʊd/' },
  'government': { definition: 'n. 政府', phonetic: '/ˈɡʌvərnmənt/' },
  'great': { definition: 'adj. 伟大的', phonetic: '/ɡreɪt/' },
  'green': { definition: 'adj. 绿色的', phonetic: '/ɡriːn/' },
  'ground': { definition: 'n. 地面', phonetic: '/ɡraʊnd/' },
  'group': { definition: 'n. 组', phonetic: '/ɡruːp/' },
  'grow': { definition: 'v. 生长', phonetic: '/ɡroʊ/' },
  'growth': { definition: 'n. 增长', phonetic: '/ɡroʊθ/' },
  'guess': { definition: 'v. 猜测', phonetic: '/ɡes/' },
  'gun': { definition: 'n. 枪', phonetic: '/ɡʌn/' },
  'guy': { definition: 'n. 家伙', phonetic: '/ɡaɪ/' },
  'hair': { definition: 'n. 头发', phonetic: '/her/' },
  'half': { definition: 'n. 一半', phonetic: '/hæf/' },
  'hand': { definition: 'n. 手', phonetic: '/hænd/' },
  'hang': { definition: 'v. 悬挂', phonetic: '/hæŋ/' },
  'happen': { definition: 'v. 发生', phonetic: '/ˈhæpən/' },
  'happy': { definition: 'adj. 快乐的', phonetic: '/ˈhæpi/' },
  'hard': { definition: 'adj. 困难的', phonetic: '/hɑːrd/' },
  'have': { definition: 'v. 有', phonetic: '/hæv/' },
  'he': { definition: 'pron. 他', phonetic: '/hiː/' },
  'head': { definition: 'n. 头', phonetic: '/hed/' },
  'health': { definition: 'n. 健康', phonetic: '/helθ/' },
  'hear': { definition: 'v. 听到', phonetic: '/hɪr/' },
  'heart': { definition: 'n. 心', phonetic: '/hɑːrt/' },
  'heat': { definition: 'n. 热', phonetic: '/hiːt/' },
  'heavy': { definition: 'adj. 重的', phonetic: '/ˈhevi/' },
  'help': { definition: 'v. 帮助', phonetic: '/help/' },
  'her': { definition: 'pron. 她的', phonetic: '/hɜːr/' },
  'here': { definition: 'adv. 这里', phonetic: '/hɪr/' },
  'herself': { definition: 'pron. 她自己', phonetic: '/hɜːrˈself/' },
  'high': { definition: 'adj. 高的', phonetic: '/haɪ/' },
  'him': { definition: 'pron. 他', phonetic: '/hɪm/' },
  'himself': { definition: 'pron. 他自己', phonetic: '/hɪmˈself/' },
  'his': { definition: 'pron. 他的', phonetic: '/hɪz/' },
  'history': { definition: 'n. 历史', phonetic: '/ˈhɪstri/' },
  'hit': { definition: 'v. 打', phonetic: '/hɪt/' },
  'hold': { definition: 'v. 持有', phonetic: '/hoʊld/' },
  'home': { definition: 'n. 家', phonetic: '/hoʊm/' },
  'hope': { definition: 'n. 希望', phonetic: '/hoʊp/' },
  'hospital': { definition: 'n. 医院', phonetic: '/ˈhɑːspɪtl/' },
  'hot': { definition: 'adj. 热的', phonetic: '/hɑːt/' },
  'hotel': { definition: 'n. 酒店', phonetic: '/hoʊˈtel/' },
  'hour': { definition: 'n. 小时', phonetic: '/ˈaʊər/' },
  'house': { definition: 'n. 房子', phonetic: '/haʊs/' },
  'how': { definition: 'adv. 如何', phonetic: '/haʊ/' },
  'however': { definition: 'adv. 然而', phonetic: '/haʊˈevər/' },
  'huge': { definition: 'adj. 巨大的', phonetic: '/hjuːdʒ/' },
  'human': { definition: 'n. 人类', phonetic: '/ˈhjuːmən/' },
  'hundred': { definition: 'num. 百', phonetic: '/ˈhʌndrəd/' },
  'husband': { definition: 'n. 丈夫', phonetic: '/ˈhʌzbənd/' },
  'i': { definition: 'pron. 我', phonetic: '/aɪ/' },
  'idea': { definition: 'n. 想法', phonetic: '/aɪˈdiːə/' },
  'identify': { definition: 'v. 识别', phonetic: '/aɪˈdentɪfaɪ/' },
  'if': { definition: 'conj. 如果', phonetic: '/ɪf/' },
  'image': { definition: 'n. 图像', phonetic: '/ˈɪmɪdʒ/' },
  'imagine': { definition: 'v. 想象', phonetic: '/ɪˈmædʒɪn/' },
  'impact': { definition: 'n. 影响', phonetic: '/ˈɪmpækt/' },
  'important': { definition: 'adj. 重要的', phonetic: '/ɪmˈpɔːrtnt/' },
  'improve': { definition: 'v. 改善', phonetic: '/ɪmˈpruːv/' },
  'in': { definition: 'prep. 在...里', phonetic: '/ɪn/' },
  'include': { definition: 'v. 包括', phonetic: '/ɪnˈkluːd/' },
  'including': { definition: 'prep. 包括', phonetic: '/ɪnˈkluːdɪŋ/' },
  'increase': { definition: 'v. 增加', phonetic: '/ɪnˈkriːs/' },
  'indeed': { definition: 'adv. 确实', phonetic: '/ɪnˈdiːd/' },
  'indicate': { definition: 'v. 表明', phonetic: '/ˈɪndɪkeɪt/' },
  'individual': { definition: 'n. 个人', phonetic: '/ˌɪndɪˈvɪdʒuəl/' },
  'industry': { definition: 'n. 工业', phonetic: '/ˈɪndəstri/' },
  'information': { definition: 'n. 信息', phonetic: '/ˌɪnfərˈmeɪʃn/' },
  'inside': { definition: 'prep. 在...里面', phonetic: '/ˌɪnˈsaɪd/' },
  'instead': { definition: 'adv. 代替', phonetic: '/ɪnˈsted/' },
  'institution': { definition: 'n. 机构', phonetic: '/ˌɪnstɪˈtuːʃn/' },
  'interest': { definition: 'n. 兴趣', phonetic: '/ˈɪntrəst/' },
  'interesting': { definition: 'adj. 有趣的', phonetic: '/ˈɪntrəstɪŋ/' },
  'international': { definition: 'adj. 国际的', phonetic: '/ˌɪntərˈnæʃnəl/' },
  'interview': { definition: 'n. 面试', phonetic: '/ˈɪntərvjuː/' },
  'into': { definition: 'prep. 进入', phonetic: '/ˈɪntuː/' },
  'investment': { definition: 'n. 投资', phonetic: '/ɪnˈvestmənt/' },
  'involve': { definition: 'v. 涉及', phonetic: '/ɪnˈvɑːlv/' },
  'issue': { definition: 'n. 问题', phonetic: '/ˈɪʃuː/' },
  'it': { definition: 'pron. 它', phonetic: '/ɪt/' },
  'item': { definition: 'n. 项目', phonetic: '/ˈaɪtəm/' },
  'its': { definition: 'pron. 它的', phonetic: '/ɪts/' },
  'itself': { definition: 'pron. 它自己', phonetic: '/ɪtˈself/' },
  'job': { definition: 'n. 工作', phonetic: '/dʒɑːb/' },
  'join': { definition: 'v. 加入', phonetic: '/dʒɔɪn/' },
  'just': { definition: 'adv. 刚刚', phonetic: '/dʒʌst/' },
  'keep': { definition: 'v. 保持', phonetic: '/kiːp/' },
  'key': { definition: 'n. 钥匙', phonetic: '/kiː/' },
  'kid': { definition: 'n. 孩子', phonetic: '/kɪd/' },
  'kill': { definition: 'v. 杀死', phonetic: '/kɪl/' },
  'kind': { definition: 'n. 种类', phonetic: '/kaɪnd/' },
  'kitchen': { definition: 'n. 厨房', phonetic: '/ˈkɪtʃɪn/' },
  'know': { definition: 'v. 知道', phonetic: '/noʊ/' },
  'knowledge': { definition: 'n. 知识', phonetic: '/ˈnɑːlɪdʒ/' },
  'land': { definition: 'n. 土地', phonetic: '/lænd/' },
  'language': { definition: 'n. 语言', phonetic: '/ˈlæŋɡwɪdʒ/' },
  'large': { definition: 'adj. 大的', phonetic: '/lɑːrdʒ/' },
  'last': { definition: 'adj. 最后的', phonetic: '/læst/' },
  'late': { definition: 'adj. 晚的', phonetic: '/leɪt/' },
  'later': { definition: 'adv. 后来', phonetic: '/ˈleɪtər/' },
  'latest': { definition: 'adj. 最新的', phonetic: '/ˈleɪtɪst/' },
  'laugh': { definition: 'v. 笑', phonetic: '/læf/' },
  'law': { definition: 'n. 法律', phonetic: '/lɔː/' },
  'lawyer': { definition: 'n. 律师', phonetic: '/ˈlɔːjər/' },
  'lay': { definition: 'v. 放置', phonetic: '/leɪ/' },
  'lead': { definition: 'v. 领导', phonetic: '/liːd/' },
  'leader': { definition: 'n. 领导者', phonetic: '/ˈliːdər/' },
  'learn': { definition: 'v. 学习', phonetic: '/lɜːrn/' },
  'least': { definition: 'adj. 最少的', phonetic: '/liːst/' },
  'leave': { definition: 'v. 离开', phonetic: '/liːv/' },
  'left': { definition: 'adj. 左边的', phonetic: '/left/' },
  'leg': { definition: 'n. 腿', phonetic: '/leɡ/' },
  'legal': { definition: 'adj. 合法的', phonetic: '/ˈliːɡl/' },
  'less': { definition: 'adj. 更少的', phonetic: '/les/' },
  'let': { definition: 'v. 让', phonetic: '/let/' },
  'letter': { definition: 'n. 信', phonetic: '/ˈletər/' },
  'level': { definition: 'n. 水平', phonetic: '/ˈlevl/' },
  'lie': { definition: 'v. 躺', phonetic: '/laɪ/' },
  'life': { definition: 'n. 生活', phonetic: '/laɪf/' },
  'light': { definition: 'n. 光', phonetic: '/laɪt/' },
  'like': { definition: 'v. 喜欢', phonetic: '/laɪk/' },
  'likely': { definition: 'adj. 可能的', phonetic: '/ˈlaɪkli/' },
  'line': { definition: 'n. 线', phonetic: '/laɪn/' },
  'list': { definition: 'n. 列表', phonetic: '/lɪst/' },
  'listen': { definition: 'v. 听', phonetic: '/ˈlɪsn/' },
  'little': { definition: 'adj. 小的', phonetic: '/ˈlɪtl/' },
  'live': { definition: 'v. 生活', phonetic: '/lɪv/' },
  'local': { definition: 'adj. 当地的', phonetic: '/ˈloʊkl/' },
  'location': { definition: 'n. 位置', phonetic: '/loʊˈkeɪʃn/' },
  'long': { definition: 'adj. 长的', phonetic: '/lɔːŋ/' },
  'look': { definition: 'v. 看', phonetic: '/lʊk/' },
  'lose': { definition: 'v. 失去', phonetic: '/luːz/' },
  'loss': { definition: 'n. 损失', phonetic: '/lɔːs/' },
  'lot': { definition: 'n. 许多', phonetic: '/lɑːt/' },
  'love': { definition: 'n. 爱', phonetic: '/lʌv/' },
  'low': { definition: 'adj. 低的', phonetic: '/loʊ/' },
  'machine': { definition: 'n. 机器', phonetic: '/məˈʃiːn/' },
  'magazine': { definition: 'n. 杂志', phonetic: '/ˈmæɡəziːn/' },
  'main': { definition: 'adj. 主要的', phonetic: '/meɪn/' },
  'maintain': { definition: 'v. 维持', phonetic: '/meɪnˈteɪn/' },
  'major': { definition: 'adj. 主要的', phonetic: '/ˈmeɪdʒər/' },
  'majority': { definition: 'n. 多数', phonetic: '/məˈdʒɔːrəti/' },
  'make': { definition: 'v. 制作', phonetic: '/meɪk/' },
  'man': { definition: 'n. 男人', phonetic: '/mæn/' },
  'manage': { definition: 'v. 管理', phonetic: '/ˈmænɪdʒ/' },
  'management': { definition: 'n. 管理', phonetic: '/ˈmænɪdʒmənt/' },
  'manager': { definition: 'n. 经理', phonetic: '/ˈmænɪdʒər/' },
  'many': { definition: 'adj. 许多', phonetic: '/ˈmeni/' },
  'market': { definition: 'n. 市场', phonetic: '/ˈmɑːrkɪt/' },
  'marriage': { definition: 'n. 婚姻', phonetic: '/ˈmærɪdʒ/' },
  'material': { definition: 'n. 材料', phonetic: '/məˈtɪriəl/' },
  'matter': { definition: 'n. 事情', phonetic: '/ˈmætər/' },
  'may': { definition: 'v. 可能', phonetic: '/meɪ/' },
  'maybe': { definition: 'adv. 也许', phonetic: '/ˈmeɪbi/' },
  'me': { definition: 'pron. 我', phonetic: '/miː/' },
  'mean': { definition: 'v. 意思是', phonetic: '/miːn/' },
  'measure': { definition: 'v. 测量', phonetic: '/ˈmeʒər/' },
  'media': { definition: 'n. 媒体', phonetic: '/ˈmiːdiə/' },
  'medical': { definition: 'adj. 医学的', phonetic: '/ˈmedɪkl/' },
  'meet': { definition: 'v. 遇见', phonetic: '/miːt/' },
  'meeting': { definition: 'n. 会议', phonetic: '/ˈmiːtɪŋ/' },
  'member': { definition: 'n. 成员', phonetic: '/ˈmembər/' },
  'memory': { definition: 'n. 记忆', phonetic: '/ˈmeməri/' },
  'mention': { definition: 'v. 提到', phonetic: '/ˈmenʃn/' },
  'message': { definition: 'n. 消息', phonetic: '/ˈmesɪdʒ/' },
  'method': { definition: 'n. 方法', phonetic: '/ˈmeθəd/' },
  'middle': { definition: 'n. 中间', phonetic: '/ˈmɪdl/' },
  'might': { definition: 'v. 可能', phonetic: '/maɪt/' },
  'military': { definition: 'adj. 军事的', phonetic: '/ˈmɪləteri/' },
  'million': { definition: 'num. 百万', phonetic: '/ˈmɪljən/' },
  'mind': { definition: 'n. 头脑', phonetic: '/maɪnd/' },
  'minute': { definition: 'n. 分钟', phonetic: '/ˈmɪnɪt/' },
  'miss': { definition: 'v. 错过', phonetic: '/mɪs/' },
  'mission': { definition: 'n. 使命', phonetic: '/ˈmɪʃn/' },
  'model': { definition: 'n. 模型', phonetic: '/ˈmɑːdl/' },
  'modern': { definition: 'adj. 现代的', phonetic: '/ˈmɑːdərn/' },
  'moment': { definition: 'n. 时刻', phonetic: '/ˈmoʊmənt/' },
  'money': { definition: 'n. 钱', phonetic: '/ˈmʌni/' },
  'month': { definition: 'n. 月', phonetic: '/mʌnθ/' },
  'more': { definition: 'adj. 更多', phonetic: '/mɔːr/' },
  'morning': { definition: 'n. 早上', phonetic: '/ˈmɔːrnɪŋ/' },
  'most': { definition: 'adj. 最多的', phonetic: '/moʊst/' },
  'mother': { definition: 'n. 母亲', phonetic: '/ˈmʌðər/' },
  'mouth': { definition: 'n. 嘴', phonetic: '/maʊθ/' },
  'move': { definition: 'v. 移动', phonetic: '/muːv/' },
  'movement': { definition: 'n. 运动', phonetic: '/ˈmuːvmənt/' },
  'movie': { definition: 'n. 电影', phonetic: '/ˈmuːvi/' },
  'much': { definition: 'adj. 许多', phonetic: '/mʌtʃ/' },
  'music': { definition: 'n. 音乐', phonetic: '/ˈmjuːzɪk/' },
  'must': { definition: 'v. 必须', phonetic: '/mʌst/' },
  'my': { definition: 'pron. 我的', phonetic: '/maɪ/' },
  'myself': { definition: 'pron. 我自己', phonetic: '/maɪˈself/' },
  'name': { definition: 'n. 名字', phonetic: '/neɪm/' },
  'nation': { definition: 'n. 国家', phonetic: '/ˈneɪʃn/' },
  'national': { definition: 'adj. 国家的', phonetic: '/ˈnæʃnəl/' },
  'natural': { definition: 'adj. 自然的', phonetic: '/ˈnætʃrəl/' },
  'nature': { definition: 'n. 自然', phonetic: '/ˈneɪtʃər/' },
  'near': { definition: 'prep. 在...附近', phonetic: '/nɪr/' },
  'nearly': { definition: 'adv. 几乎', phonetic: '/ˈnɪrli/' },
  'necessary': { definition: 'adj. 必要的', phonetic: '/ˈnesəseri/' },
  'need': { definition: 'v. 需要', phonetic: '/niːd/' },
  'network': { definition: 'n. 网络', phonetic: '/ˈnetwɜːrk/' },
  'never': { definition: 'adv. 从不', phonetic: '/ˈnevər/' },
  'new': { definition: 'adj. 新的', phonetic: '/nuː/' },
  'news': { definition: 'n. 新闻', phonetic: '/nuːz/' },
  'newspaper': { definition: 'n. 报纸', phonetic: '/ˈnuːzpeɪpər/' },
  'next': { definition: 'adj. 下一个', phonetic: '/nekst/' },
  'nice': { definition: 'adj. 好的', phonetic: '/naɪs/' },
  'night': { definition: 'n. 夜晚', phonetic: '/naɪt/' },
  'no': { definition: 'adv. 不', phonetic: '/noʊ/' },
  'none': { definition: 'pron. 没有一个', phonetic: '/nʌn/' },
  'nor': { definition: 'conj. 也不', phonetic: '/nɔːr/' },
  'north': { definition: 'n. 北', phonetic: '/nɔːrθ/' },
  'not': { definition: 'adv. 不', phonetic: '/nɑːt/' },
  'note': { definition: 'n. 笔记', phonetic: '/noʊt/' },
  'nothing': { definition: 'pron. 没有什么', phonetic: '/ˈnʌθɪŋ/' },
  'notice': { definition: 'v. 注意', phonetic: '/ˈnoʊtɪs/' },
  'now': { definition: 'adv. 现在', phonetic: '/naʊ/' },
  'number': { definition: 'n. 数字', phonetic: '/ˈnʌmbər/' },
};

// ========== 词典服务 ==========

export interface WordDefinition {
  word: string;
  phonetic?: string;
  definition: string;
  isCommon: boolean;
}

export const Dictionary = {
  /**
   * 查询单词定义
   */
  lookup(word: string): WordDefinition | null {
    const normalized = word.toLowerCase().trim();
    const entry = BASE_DICT[normalized];

    if (!entry) {
      return null;
    }

    return {
      word: normalized,
      phonetic: entry.phonetic,
      definition: entry.definition,
      isCommon: COMMON_WORDS.has(normalized),
    };
  },

  /**
   * 批量查询多个单词
   */
  lookupMany(words: string[]): Map<string, WordDefinition> {
    const result = new Map<string, WordDefinition>();

    for (const word of words) {
      const def = this.lookup(word);
      if (def) {
        result.set(word.toLowerCase(), def);
      }
    }

    return result;
  },

  /**
   * 检查是否为常见词（基础词汇，不应被标注）
   */
  isCommonWord(word: string): boolean {
    const w = word.toLowerCase().trim();
    // 检查是否在常用词列表中，或者是短单词
    return COMMON_WORDS.has(w) || SHORT_WORDS.has(w) || w.length <= 3;
  },

  /**
   * 估算单词难度等级 (1-6, 6为最难)
   */
  estimateWordDifficulty(word: string): number {
    const w = word.toLowerCase().trim();

    // 如果是常见词，难度为1
    if (this.isCommonWord(w)) {
      return 1;
    }

    // 基础难度
    let difficulty = 3;

    // 根据长度增加难度
    if (w.length >= 10) difficulty += 1;
    if (w.length >= 13) difficulty += 1;

    // 包含连字符或特殊字符增加难度
    if (w.includes('-') || w.includes("'")) difficulty += 0.5;

    // 检查是否有词典定义
    const def = this.lookup(w);
    if (!def) {
      // 词典中没有的单词可能是专有名词或非常用词
      difficulty += 1;
    } else if (def.isCommon) {
      // 词典中标记为常见的，降低难度
      difficulty = Math.max(1, difficulty - 1);
    }

    return Math.min(6, Math.max(1, Math.round(difficulty)));
  },

  /**
   * 从文本中提取单词并标记生词
   * 改进版：更智能的过滤和难度评估
   */
  async analyzeText(text: string, userKnownWords?: Set<string>, minDifficulty: number = 3): Promise<{
    words: { word: string; isNew: boolean; definition?: string; difficulty?: number }[];
    newWordsCount: number;
    knownWordsCount: number;
  }> {
    // 提取单词
    const wordMatches = text.match(/\b[a-zA-Z]+(?:['-][a-zA-Z]+)?\b/g) || [];
    const uniqueWords = [...new Set(wordMatches.map(w => w.toLowerCase()))];

    const words: { word: string; isNew: boolean; definition?: string; difficulty?: number }[] = [];
    let newWordsCount = 0;
    let knownWordsCount = 0;

    // 获取用户已掌握的单词
    const knownWords = userKnownWords || new Set();

    // 需要过滤掉的模式
    const skipPatterns = [
      /^\d+$/,                    // 纯数字
      /^[a-z]\./i,                // 单个字母缩写
      /^[a-z]\.[a-z]\./i,         // 多字母缩写
      /^(https?|ftp|www|com|org|net|io|app)$/i, // URL相关
      /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)$/i, // 月份缩写
      /^(mon|tue|wed|thu|fri|sat|sun)$/i, // 星期缩写
    ];

    for (const word of uniqueWords) {
      // 应用过滤规则
      if (skipPatterns.some(pattern => pattern.test(word))) continue;

      // 检查是否在用户已知单词中
      if (knownWords.has(word)) {
        words.push({ word, isNew: false, difficulty: 1 });
        knownWordsCount++;
        continue;
      }

      // 检查是否为常见词（基础词汇）
      if (this.isCommonWord(word)) {
        words.push({ word, isNew: false, difficulty: 1 });
        knownWordsCount++;
        continue;
      }

      // 查询词典
      const def = this.lookup(word);
      const difficulty = this.estimateWordDifficulty(word);

      // 只标记难度 >= minDifficulty 的单词
      const isNew = difficulty >= minDifficulty;

      words.push({
        word,
        isNew,
        definition: def?.definition,
        difficulty,
      });

      if (isNew) {
        newWordsCount++;
      } else {
        knownWordsCount++;
      }
    }

    return {
      words,
      newWordsCount,
      knownWordsCount,
    };
  },

  /**
   * 获取单词的词形变化（简化版）
   */
  getLemma(word: string): string {
    const w = word.toLowerCase().trim();

    // 简单的词形还原规则
    const rules = [
      { pattern: /ies$/, replacement: 'y' },
      { pattern: /(ch|sh|x|s|z|o)es$/, replacement: '$1' },
      { pattern: /([^aeiou])ies$/, replacement: '$1y' },
      { pattern: /s$/, replacement: '' },
      { pattern: /ing$/, replacement: '' },
      { pattern: /(.)ing$/, replacement: '$1' },
      { pattern: /ed$/, replacement: '' },
      { pattern: /(.)ed$/, replacement: '$1' },
      { pattern: /er$/, replacement: '' },
      { pattern: /est$/, replacement: '' },
      { pattern: /ly$/, replacement: '' },
      { pattern: /ness$/, replacement: '' },
      { pattern: /ment$/, replacement: '' },
    ];

    for (const rule of rules) {
      const lemma = w.replace(rule.pattern, rule.replacement);
      if (lemma !== w && this.lookup(lemma)) {
        return lemma;
      }
    }

    return w;
  },

  /**
   * 搜索单词（前缀匹配）
   */
  search(prefix: string, limit: number = 10): WordDefinition[] {
    const normalizedPrefix = prefix.toLowerCase().trim();
    const results: WordDefinition[] = [];

    for (const [word, entry] of Object.entries(BASE_DICT)) {
      if (word.startsWith(normalizedPrefix)) {
        results.push({
          word,
          phonetic: entry.phonetic,
          definition: entry.definition,
          isCommon: COMMON_WORDS.has(word),
        });

        if (results.length >= limit) {
          break;
        }
      }
    }

    return results;
  },
};