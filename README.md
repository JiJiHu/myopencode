# 🏴‍☠️ 海贼小游戏合集 v2.0

一个航海王主题的多功能网页游戏合集，包含7个经典休闲游戏和策略游戏。

## 🎯 游戏列表

### 1. 超级贪吃蛇 (Snake) 🐍
- **路径**: `games/snake/snake.html`
- **特色**: 经典街机游戏的升级版
- **玩法**:
  - 使用方向键或 WASD 控制移动
  - 吃食物变长，碰到墙壁或自己游戏结束
  - 支持移动端触摸控制
- **功能**:
  - 分数记录和最高分保存
  - 多种难度可选
  - 炫酷的动画效果
  - 炫目的宝藏食物和特殊道具

### 2. 五子棋对决 (Gomoku) ⚫⚪
- **路径**: `games/gomoku/gomoku.html`
- **特色**: 海贼决斗场主题的策略游戏
- **玩法**:
  - 双人本地对战模式
  - AI 挑战模式（三种难度）
  - 五子连线获胜
- **功能**:
  - 实时AI思考显示
  - 落子音效
  - 胜负判定
  - 精美的棋盘和棋子设计

### 3. 数独冒险 (Sudoku) 🔢
- **路径**: `games/sudoku/sudoku.html`
- **特色**: 破解海盗留下的密码宝藏
- **玩法**:
  - 三个难度级别：简单、中等、困难
  - 键盘和数字键盘双控制
  - 错误提示功能
  - 提示功能帮助解题
- **功能**:
  - 实时计时
  - 错误计数
  - 唯一解保证
  - 统计数据记录

### 4. 扫雷海战 (Minesweeper) 💣
- **路径**: `games/minesweeper/minesweeper.html`
- **特色**: 海上的危险水雷潜伏！
- **玩法**:
  - 运用智慧找出所有水雷
  - 标记可疑区域
  - 避开爆炸
- **功能**:
  - 三种难度等级
  - 计时挑战
  - 排行榜系统
  - 精美动画效果

### 5. 航海王打砖块 (Breakout) 🧱
- **路径**: `games/breakout/breakout.html`
- **特色**: 击碎所有砖块！海上冒险！
- **玩法**:
  - 球拍和球消除砖块
  - 砖块需要多次击打
  - 特殊砖块和道具
- **功能**:
  - 生命值系统（3条命）
  - 分数记录
  - 粒子特效
  - 暂停/继续功能
  - 退回主页按钮

### 6. 航海王塔防 (Tower Defense) 🛡️
- **路径**: `games/tower-defense/tower-defense.html`
- **特色**: 守护宝藏！阻止敌人入侵！
- **玩法**:
  - 在路径上布置防御塔
  - 升级和强化防御塔
  - 抵御多个波次的敌人
- **功能**:
  - 多种防御塔类型
  - 敌人生命值实时更新
  - 波次即时启动
  - 游戏加速功能
  - 暂停/继续/退出

### 7. 海盗连珠 (Color Lines) 🎨
- **路径**: `games/color-lines/color-lines.html`
- **特色**: 智闯连珠！智力挑战！
- **玩法**:
  - 9x9 棋盘，7种颜色球
  - 移动彩球，连成5个或更多同色球消除
  - 每轮出现3个新球
- **功能**:
  - 聪明的路径查找算法
  - 撤回功能（最多15步）
  - 排行榜系统
  - 计分系统
  - 退回主页按钮

---

## 🎨 特性

- ✨ 海盗主题现代化 UI 设计
- 📱 响应式布局，完美支持移动端
- 🎯 清晰的游戏界面和操作提示
- 💾 数据持久化（最高分记录、排行榜）
- 🎮 多种操作方式（键盘、触摸、鼠标）
- 🏆 游戏成就和排行榜
- 🔄 撤回和暂停功能
- 🎬 流畅的动画和特效

---

## 🚀 部署

### Vercel 部署

1. **GitHub 仓库**
   ```bash
   # 仓库名称: mygame
   git remote -v
   # origin: https://github.com/JiJiHu/mygame.git
   ```

2. **Vercel 项目**
   - 访问 [vercel.com](https://vercel.com)
   - 导入 `JiJiHu/mygame` 仓库
   - 项目名称：`mygame-pirate`
   - 自动部署

3. **部署 URL**
   - 主页：`https://mygame-pirate.vercel.app/`
   - 游戏直接访问：`https://mygame-pirate.vercel.app/games/游戏名/游戏文件.html`

### 本地运行

```bash
# 直接在浏览器中打开
open index.html

# 或使用本地服务器
python3 -m http.server 8000
# 访问 http://localhost:8000
```

### Docker 部署 (推荐)

```bash
# 1. 构建镜像
docker build -t mygame:latest .

# 2. 运行容器
docker run -d -p 8080:80 --name mygame mygame:latest

# 3. 访问游戏
# http://localhost:8080
```

#### 使用 docker-compose (更方便)

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

#### 访问地址
- 主站: http://localhost:8080
- 贪吃蛇: http://localhost:8080/games/snake/snake.html
- 五子棋: http://localhost:8080/games/gomoku/gomoku.html


---

## 📝 技术栈

- **HTML5**: 语义化结构
- **CSS3**: Flexbox, Grid, Animations
- **JavaScript**: ES6+ 特性
- **Canvas API**: 游戏渲染
- **LocalStorage**: 数据持久化

---

## 🗺️ 项目结构

```
mygame/
├── index.html                     # 主主页
├── games/
│   ├── snake/
│   │   └── snake.html            # 超级贪吃蛇
│   ├── gomoku/
│   │   └── gomoku.html           # 五子棋对决
│   ├── sudoku/
│   │   └── sudoku.html           # 数独冒险
│   ├── minesweeper/
│   │   └── minesweeper.html      # 扫雷海战
│   ├── breakout/
│   │   └── breakout.html         # 航海王打砖块
│   ├── tower-defense/
│   │   └── tower-defense.html    # 航海王塔防
│   └── color-lines/
│       └── color-lines.html      # 海盗连珠
├── onepiece-theme.css            # 海贼主题样式
├── onepage-home.css              # 主页样式
└── README.md                     # 本文档
```

---

## ⚙️ 游戏配置

**所有游戏都支持：**
- 键盘操作
- 触摸操作
- 鼠标操作
- 返回主页按钮
- 响应式设计

---

## 📄 许可证

MIT License

---

## 👤 作者

**Jack**
- GitHub: JiJiHu
- 项目：海贼小游戏合集 v2.0

---

## 🐛 已知问题

- 部分游戏在极小屏幕上显示不佳
- 需要进一步优化移动端体验

---

## 🚧 即将推出

- [ ] 多人对战在线功能
- [ ] 成就系统
- [ ] 更多游戏关卡
- [ ] 皮肤自定义

---

**享受游戏！⚓🏴‍☠️** 🎮✨

---

**更新历史：**
- v2.0 (2026-02): 新增打砖块、塔防、五彩连珠游戏
- v1.0 (2024-02): 初始版本，包含贪吃蛇、五子棋、数独
