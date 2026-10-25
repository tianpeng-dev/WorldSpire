# 人教版英语（精通）三年级下册词汇题库

教材编号：`1212001302244`。来源为人民教育出版社《义务教育教科书 英语（精通）三年级下册》。用户已声明获得下载授权。

词汇表位于PDF及官方阅读器第93—95页，对应教材印刷第87—89页，章节为 `Appendix 2 · Vocabulary in each unit`。交叉核对使用PDF第96—99页的 `Appendix 3 · Vocabulary A-Z`。

## 词汇与题目

共112条单词、短语和日常表达，六个单元的条目数量依次为23、18、19、18、21、13。全部条目保留教材原有单元和词语顺序。

每条词汇生成一道 `meaning_match` 词义选择题，共112道题目。题库包含1个课程、6个单元、14个关卡，每个关卡最多10道题目，采用与上册相同的关卡划分和难度规则。

`father`、`mother`、`grandfather`、`grandmother`在 `variants` 中分别保留教材列出的 `dad`、`mum`、`grandpa`、`grandma`。

`colour`保存在一条词汇记录中，释义为“颜色；为……着色”。`lesson_page`保存名词义的第66页，`usage_note`说明动词义的第70页及使用说明。`chicken`、`fish`、`orange`分别保留下册的“鸡”“鱼”“橙色的”释义。

中文释义统一空格和标点，用法说明保存在 `usage_note`。英文保留教材词形和表达式标点。音频与配图字段为空值。

## 文件用途

| 文件 | 内容 |
| --- | --- |
| `vocabulary.json` | 教材信息、112条词汇、中文释义、单元顺序、用法、词形、课内页码、来源页码及SHA-256 |
| `vocabulary.csv` | 与词汇JSON相同的记录，采用UTF-8 BOM；`variants`为JSON数组字符串 |
| `question-bank.json` | 课程、单元、关卡、题目及题目与词汇的来源关系 |
| `question-bank.csv` | 112道题目的数据库字段；`options`为JSON数组字符串 |
| `vocabulary.postgresql.sql` | 创建兼容上册的 `textbook_vocabulary` 表并导入下册词汇，可独立使用 |
| `wordspire.postgresql.sql` | 导入WordSpire课程、单元、关卡、题目和 `textbook_question_sources` 来源关系 |
| `source-coverage.json` | 每条英文词语在单元词汇表和字母词表的软件识别核对结果 |
| `verification.json` | 数据结构、CSV读取、来源和数据库执行核验结果 |
| `checksums.json` | 交付文件的大小及SHA-256 |

词汇JSON的字段和字段类型与上册相同。题库JSON保留相同的 `courses`、`units`、`stages`、`questions`、`question_sources` 结构。数据库字段使用 snake_case，`correct_index`从0开始计数。

每道题目包含四个中文选项，正确答案对应词汇释义。其余选项取自下册词汇，生成时排除中文释义重叠项。

## 导入顺序

独立词汇数据库执行 `vocabulary.postgresql.sql` 即可。

WordSpire数据库需要先建立项目现有内容表，再依次执行：

1. `vocabulary.postgresql.sql`
2. `wordspire.postgresql.sql`

下册课程和内容ID使用 `pep3b_2244` 前缀。SQL采用事务和固定ID，重复执行会更新同一教材记录。上下册可以共同导入，导入顺序均已核验。

## 已执行的核验

112条英文词语均已在单元词汇表和字母词表的软件文字识别结果中确认。核对了来源图片与PDF的SHA-256、单元顺序、字段结构、CSV全部字段、题目答案及关卡大小。

SQL在本地隔离的实际PostgreSQL引擎中执行了独立词汇导入、项目结构导入、全部记录读取、重复导入、先导入上册再导入下册、先导入下册再导入上册等核验。数据库版本、结构文件和结果见 `verification.json`。

在线数据库尚未执行导入，应用页面尚未验证使用此次题库的表现。
