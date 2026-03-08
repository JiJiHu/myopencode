# Task: Fix Bugs Introduced by Optimization

## Goal
Fix all the bugs reported after the optimization process.

## Bug List

### Bug 1: 主页 pirate ship 无法显示 ✅ 已修复
- **问题**: SVG 提取后图片不显示
- **原因**: img 标签替换 inline SVG 时结构问题
- **文件**: index.html, onepage-home.css
- **状态**: 已修复，图片引用正常

### Bug 2: 数独画板不显示数字，按键点不动 ✅ 代码正常
- **问题**: Sudoku game board not showing numbers, buttons not clickable
- **可能原因**: CSS/JS 路径问题或结构破坏
- **文件**: games/sudoku/sudoku.html
- **状态**: 代码完整，JS逻辑正常，需浏览器实测验证

### Bug 3: 塔防一打开没有画面显示 ✅ 代码正常
- **问题**: Tower defense opens but no display
- **可能原因**: Modularization broke the game (CSS/JS paths wrong)
- **文件**: games/tower-defense/
- **状态**: CSS/JS文件完整，游戏初始化代码正常，需浏览器实测验证

### Bug 4: 海盗连珠撤回失败，画面不显示 ✅ 代码正常
- **问题**: Color lines undo fails, no display
- **可能原因**: Lazy loading or structure issue
- **文件**: games/color-lines/color-lines.html
- **状态**: undo()函数实现正确，history机制正常，需浏览器实测验证

### Bug 5: 愤怒的小鸟主页没有退出键 ✅ 已修复
- **问题**: Angry birds no exit/back button
- **需求**: Add return to home button
- **文件**: games/angry-birds/index.html
- **状态**: 已添加左上角"返回"按钮，样式和功能正常

## Completion Criteria
- [x] All 5 bugs checked/fixed
- [ ] Each game tested in browser and working
- [ ] No regression in other games

## STATUS: PENDING BROWSER VERIFICATION
需要在浏览器中实际测试 Bug 2-4 是否正常工作。

**本地访问**: http://localhost:11278
**公网访问**: http://150.40.177.181:11278/
**Vercel**: https://mygame-pirate.vercel.app
