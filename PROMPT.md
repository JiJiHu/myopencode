# Task: Fix Bugs Introduced by Optimization

## Goal
Fix all the bugs reported after the optimization process.

## Bug List

### Bug 1: 主页 pirate ship 无法显示
- **问题**: SVG 提取后图片不显示
- **原因**: img 标签替换 inline SVG 时结构问题
- **文件**: index.html, onepage-home.css

### Bug 2: 数独画板不显示数字，按键点不动
- **问题**: Sudoku game board not showing numbers, buttons not clickable
- **可能原因**: CSS/JS 路径问题或结构破坏
- **文件**: games/sudoku/sudoku.html

### Bug 3: 塔防一打开没有画面显示
- **问题**: Tower defense opens but no display
- **可能原因**: Modularization broke the game (CSS/JS paths wrong)
- **文件**: games/tower-defense/

### Bug 4: 海盗连珠撤回失败，画面不显示
- **问题**: Color lines undo fails, no display
- **可能原因**: Lazy loading or structure issue
- **文件**: games/color-lines/color-lines.html

### Bug 5: 愤怒的小鸟主页没有退出键
- **问题**: Angry birds no exit/back button
- **需求**: Add return to home button
- **文件**: games/angry-birds/index.html

## Completion Criteria
- All 5 bugs fixed
- Each game tested and working
- No regression in other games
- Add STATUS: COMPLETE when done
