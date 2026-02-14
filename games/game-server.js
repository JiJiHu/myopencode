const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const compression = require('compression');

const app = express();
const PORT = 8080;

// 数据文件路径
const DATA_FILE = path.join(__dirname, 'leaderboard-data.json');

// ========== 内存缓存 ==========
let leaderboardCache = {};

// 初始化缓存
function initCache() {
    try {
        const data = readData();
        for (const game in data) {
            leaderboardCache[game] = data[game];
        }
        console.log('✅ 排行榜缓存已初始化');
    } catch (error) {
        console.error('❌ 缓存初始化失败:', error);
    }
}

// 更新缓存
function updateCache(game, data) {
    leaderboardCache[game] = data;
}

// 清空缓存
function clearCache() {
    leaderboardCache = {};
    console.log('🗑️  缓存已清空');
}

// ========== 请求频率限制 ==========
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1分钟
const RATE_LIMIT_MAX = 60; // 每分钟最多60次请求

function checkRateLimit(ip) {
    const now = Date.now();
    const requests = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

    if (now > requests.resetTime) {
        // 时间窗口已过，重置计数
        requests.count = 0;
        requests.resetTime = now + RATE_LIMIT_WINDOW;
    }

    if (requests.count >= RATE_LIMIT_MAX) {
        return false;
    }

    requests.count++;
    rateLimitMap.set(ip, requests);
    return true;
}

// 中间件 - 配置CORS
app.use(cors());

// 中间件 - Gzip压缩
app.use(compression({
    threshold: 1024, // 只压缩大于1KB的响应
    level: 6, // 压缩级别（1-9，6为默认）
}));

// 中间件 - 率限制
app.use((req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(ip)) {
        console.log(`🚫 ${ip} 请求超限`);
        return res.status(429).json({
            success: false,
            error: '请求过于频繁，请稍后再试'
        });
    }
    next();
});

app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method.padEnd(6);
    const url = req.url.padEnd(40);
    console.log(`[${timestamp}] ${method} ${url} | ${req.ip}`);
    next();
});

// ========== 输入验证工具函数 ==========
function validateScoreData(scoreData) {
    const errors = [];

    // 检查必填字段
    if (!scoreData || typeof scoreData !== 'object') {
        return { valid: false, error: '无效的分数数据' };
    }

    // 兼容新旧字段名：playerName（新）或 name（旧）
    const playerName = scoreData.playerName || scoreData.name;

    // 验证名字
    if (!playerName) {
        errors.push('玩家名称不能为空');
    } else if (typeof playerName !== 'string') {
        errors.push('玩家名称格式不正确');
    } else if (playerName.length > 20) {
        errors.push('玩家名称不能超过20个字符');
    } else if (!/^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]+$/.test(playerName)) {
        errors.push('玩家名称只能包含中文、英文、数字、下划线、短横线和空格');
    }

    // 验证分数或时间
    if (!scoreData.score && scoreData.score !== 0 && !scoreData.time && scoreData.time !== 0) {
        errors.push('必须提供分数或时间');
    } else {
        if (scoreData.score !== undefined) {
            if (typeof scoreData.score !== 'number' || isNaN(scoreData.score)) {
                errors.push('分数必须是数字');
            } else if (scoreData.score < 0 || scoreData.score > 999999) {
                errors.push('分数超出合理范围（0-999999）');
            }
        }

        if (scoreData.time !== undefined) {
            if (typeof scoreData.time !== 'number' || isNaN(scoreData.time)) {
                errors.push('时间必须是数字');
            } else if (scoreData.time < 0 || scoreData.time > 9999) {
                errors.push('时间超出合理范围（0-9999秒）');
            }
        }
    }

    // 验证等级（如果提供）
    if (scoreData.level !== undefined) {
        if (typeof scoreData.level !== 'number' || isNaN(scoreData.level)) {
            errors.push('等级必须是数字');
        } else if (scoreData.level < 1 || scoreData.level > 100) {
            errors.push('等级超出合理范围（1-100）');
        }
    }

    // 验证难度（如果提供）
    if (scoreData.difficulty !== undefined) {
        const validDifficulties = ['easy', 'medium', 'hard'];
        if (!validDifficulties.includes(scoreData.difficulty)) {
            errors.push(`难度必须是: ${validDifficulties.join(', ')}`);
        }
    }

    return {
        valid: errors.length === 0,
        error: errors.length > 0 ? errors.join('; ') : null
    };
}

// ========== API 路由 ==========

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '游戏服务器运行中',
        timestamp: Date.now(),
        uptime: process.uptime()
    });
});

// 获取游戏排行榜（支持分页）
app.get('/api/leaderboard/:game', (req, res) => {
    try {
        const { game } = req.params;
        const gameName = game.toLowerCase();

        // 获取分页参数
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;

        if (page < 1) {
            return res.status(400).json({
                success: false,
                error: '页码必须大于等于 1'
            });
        }

        if (limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                error: '每页数量必须在 1-100 之间'
            });
        }

        const offset = (page - 1) * limit;

        // 验证游戏名称
        const validGames = ['snake', 'sudoku', 'gomoku', 'sokoban', 'minesweeper', 'sliding-puzzle'];
        if (!validGames.includes(gameName)) {
            return res.status(400).json({
                success: false,
                error: `无效的游戏名称，必须是: ${validGames.join(', ')}`
            });
        }

        // 优先使用缓存
        const leaderboard = leaderboardCache[gameName] || [];
        const data = readData();
        const freshLeaderboard = data[gameName] || [];

        // 如果缓存为空或数据有更新，更新缓存
        if (leaderboard.length !== freshLeaderboard.length) {
            updateCache(gameName, freshLeaderboard);
        }

        // 分页处理
        const total = freshLeaderboard.length;
        const items = freshLeaderboard.slice(offset, offset + limit);

        const response = {
            success: true,
            leaderboard: items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: offset + limit < total,
                hasPrevPage: page > 1 && total > 0
            }
        };

        console.log(`📊 获取 ${gameName} 排行榜: ${total} 条记录 (第${page}页, ${items.length}条) (缓存: ${leaderboardCache[gameName] ? '命中' : '未命中'})`);
        res.json(response);
    } catch (error) {
        console.error('❌ 获取排行榜失败:', error);
        res.status(500).json({ success: false, error: '获取排行榜失败' });
    }
});

// 添加分数到排行榜
app.post('/api/leaderboard/:game', (req, res) => {
    try {
        const { game } = req.params;
        const gameName = game.toLowerCase();
        const scoreData = req.body;

        // 验证游戏名称
        const validGames = ['snake', 'sudoku', 'gomoku', 'sokoban', 'minesweeper', 'sliding-puzzle'];
        if (!validGames.includes(gameName)) {
            return res.status(400).json({
                success: false,
                error: `无效的游戏名称，必须是: ${validGames.join(', ')}`
            });
        }

        // 验证数据
        const validation = validateScoreData(scoreData);
        if (!validation.valid) {
            console.error('❌ 数据验证失败:', validation.error);
            return res.status(400).json({
                success: false,
                error: '数据验证失败: ' + validation.error
            });
        }

        // 标准化字段名（兼容新旧格式）
        if (!scoreData.name && scoreData.playerName) {
            scoreData.name = scoreData.playerName;
        }

        // 添加时间戳
        scoreData.date = new Date().toISOString();
        scoreData.timestamp = Date.now();

        // 读取数据
        const data = readData();

        // 初始化游戏排行榜
        if (!data[gameName]) {
            data[gameName] = [];
        }

        console.log(`📝 接收 ${gameName} 分数: ${scoreData.name}`);

        // 添加新分数
        data[gameName].push(scoreData);

        // 根据不同游戏排序
        if (gameName === 'sudoku') {
            // 数独按时间排序（越短越好）
            data[gameName].sort((a, b) => a.time - b.time);
        } else if (gameName === 'sokoban') {
            // 推箱子按步数排序（越少越好），步数相同按推箱次数排序
            data[gameName].sort((a, b) => {
                const movesA = a.moves || a.score;
                const movesB = b.moves || b.score;
                if (movesA !== movesB) return movesA - movesB;
                return (a.pushes || 0) - (b.pushes || 0);
            });
        } else if (gameName === 'minesweeper' || gameName === 'sliding-puzzle') {
            // 扫雷和滑块拼图按分数（时间/步数）排序（越短越好）
            data[gameName].sort((a, b) => (a.score || 0) - (b.score || 0));
        } else if (gameName === 'gomoku') {
            // 五子棋按分数排序（越高越好）
            data[gameName].sort((a, b) => b.score - a.score);
        } else {
            // 其他游戏（贪吃蛇）按分数排序（越高越好）
            data[gameName].sort((a, b) => b.score - a.score);
        }

        // 只保留前50名
        data[gameName] = data[gameName].slice(0, 50);

        // 写入数据
        if (writeData(data)) {
            const displayScore = gameName === 'sudoku' ? `${scoreData.time}秒` : `${scoreData.score}分`;
            console.log(`✅ 保存 ${gameName} 分数: ${scoreData.name} - ${displayScore}`);

            // 更新缓存
            updateCache(gameName, data[gameName]);

            res.json({ success: true, leaderboard: data[gameName] });
        } else {
            res.status(500).json({ success: false, error: '保存失败' });
        }
    } catch (error) {
        console.error('❌ 保存分数失败:', error);
        res.status(500).json({ success: false, error: '保存失败: ' + error.message });
    }
});

// 清空游戏排行榜
app.delete('/api/leaderboard/:game', (req, res) => {
    try {
        const { game } = req.params;

        // 验证操作授权（简单的IP白名单）
        const adminIPs = ['::1', '127.0.0.1', '::ffff:127.0.0.1'];
        const clientIP = req.ip || req.connection.remoteAddress;

        if (!adminIPs.includes(clientIP)) {
            console.log(`🚫 未授权的删除请求来自: ${clientIP}`);
            return res.status(403).json({
                success: false,
                error: '无权限执行此操作'
            });
        }

        const data = readData();

        if (game === 'all') {
            // 清空所有排行榜
            const count = Object.keys(data).length;
            fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf8');
            console.log(`🗑️  清空所有排行榜: ${count} 个游戏`);

            // 清空缓存
            clearCache();

            res.json({ success: true, message: `已清空 ${count} 个游戏的排行榜` });
        } else {
            const gameName = game.toLowerCase();
            const validGames = ['snake', 'sudoku', 'gomoku', 'sokoban', 'minesweeper', 'sliding-puzzle'];

            if (!validGames.includes(gameName)) {
                return res.status(400).json({
                    success: false,
                    error: `无效的游戏名称，必须是: ${validGames.join(', ')}`
                });
            }

            // 清空指定游戏排行榜
            data[gameName] = [];
            writeData(data);
            console.log(`🗑️  清空 ${gameName} 排行榜`);

            // 清空缓存
            if (leaderboardCache[gameName]) {
                delete leaderboardCache[gameName];
            }

            res.json({ success: true, message: `已清空 ${gameName} 排行榜` });
        }
    } catch (error) {
        console.error('❌ 清空排行榜失败:', error);
        res.status(500).json({ success: false, error: '清空失败' });
    }
});

// 获取服务器状态API
app.get('/api/status', (req, res) => {
    try {
        const data = readData();
        const status = {
            success: true,
            server: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: Date.now()
            },
            cache: {
                games: Object.keys(leaderboardCache),
                size: JSON.stringify(leaderboardCache).length
            },
            data: {
                files: Object.keys(data),
                totalRecords: Object.values(data).reduce((sum, arr) => sum + arr.length, 0)
            }
        };
        res.json(status);
    } catch (error) {
        res.status(500).json({ success: false, error: '获取状态失败' });
    }
});

// ========== 静态文件服务 ==========

// 提供 game 目录下的静态文件
app.use(express.static(path.join(__dirname)));

// ========== 统一错误处理 ==========

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: '请求的资源不存在'
    });
});

// 全局错误处理
app.use((err, req, res, next) => {
    console.error('❌ 服务器错误:', err);

    // 验证错误
    if (err.name === 'ValidationError' || err.name === 'SyntaxError') {
        return res.status(400).json({
            success: false,
            error: '请求数据格式错误'
        });
    }

    // 其他错误
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误'
    });
});

// 根路径重定向到 index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ========== 数据管理函数 ==========

// 读取数据
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ 读取数据失败:', error);
        return {};
    }
}

// 写入数据
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('❌ 写入数据失败:', error);
        return false;
    }
}

// 初始化数据文件
function initDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf8');
        console.log('✅ 创建排行榜数据文件');
    }
}

// ========== 启动服务器 ==========

initDataFile();
initCache();

app.listen(PORT, '::', () => {
    console.log('');
    console.log('🎮 ==================================');
    console.log('🎮   游戏服务器启动成功（优化版）');
    console.log('🎮 ==================================');
    console.log('');
    console.log(`📡 监听端口: ${PORT}`);
    console.log(`🌐 本地访问: http://localhost:${PORT}`);
    console.log(`🌐 外网访问: http://150.40.177.181:${PORT}`);
    console.log('');
    console.log(`📁 静态文件: ${__dirname}`);
    console.log(`📊 排行榜API: http://0.0.0.0:${PORT}/api/leaderboard/:game`);
    console.log(`❤️  健康检查: http://0.0.0.0:${PORT}/api/health`);
    console.log(`📊 服务器状态: http://0.0.0.0:${PORT}/api/status`);
    console.log('');
    console.log('✨ 已启用优化:');
    console.log('   ✅ API请求频率限制 (60次/分钟)');
    console.log('   ✅ 输入验证和清理');
    console.log('   ✅ 内存缓存');
    console.log('   ✅ 游戏名称验证');
    console.log('   ✅ Gzip静态资源压缩');
    console.log('   ✅ 排行榜分页 (?)page=1&limit=10');
    console.log('   ✅ 统一错误处理');
    console.log('');
    console.log(`📄 日志文件: /tmp/game-server.log`);
    console.log('');
    console.log('🎮 ==================================');
    console.log('');
});
