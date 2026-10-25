# 三年级上册第93—96页词汇题库

来源为人民教育出版社《义务教育教科书 英语（精通）三年级上册》，教材编号 `1212001301244`。

页码采用已下载PDF及官方阅读器的页面顺序。PDF第93—96页对应教材印刷第87—90页，内容为 `Appendix 2 · Vocabulary in each unit`。文字通过软件识别，并结合同书PDF第97—100页的字母词表交叉核对。

## 数据内容

包含六个单元的136条单词、缩写、短语和日常表达，英文词形共135种。Unit 1至Unit 6的条目数量依次为24、26、23、18、26、19。

`have` 在Unit 2的释义为“有”，在Unit 6的释义为“吃；喝”，分别保存。`I'm`、`what's`、`it's`、`don't`、`let's`保留展开形式，`mum`和`noodle`保留教材列出的词形信息。

`meaning_zh` 为适合词义选择题的中文释义，统一空格和标点。`milk`使用“牛奶”，`soup`使用核心释义“汤”。用法说明保存在 `usage_note`。音频和配图字段为空值。

## 文件

- `vocabulary.json`：教材信息、136条词汇、单元顺序、中文释义、用法说明、课内页码、词表PDF页码、原始页面地址和SHA-256。
- `vocabulary.csv`：相同词汇数据，使用UTF-8 BOM，方便电子表格软件及数据库读取。
- `vocabulary.postgresql.sql`：建立 `textbook_vocabulary` 表并导入全部词汇，可独立用于PostgreSQL。
- `question-bank.json`：1个课程、6个单元、16个关卡、136道词义选择题及词汇来源关系，数据库字段使用 snake_case。
- `wordspire.postgresql.sql`：将课程、单元、关卡及题目导入项目现有内容表，并建立 `textbook_question_sources` 保存题目与教材词汇的关系。
- `verification.json`：页面来源、数据数量、数据库执行和读取核验结果。
- `checksums.json`：交付文件的SHA-256。

## PostgreSQL导入

独立词汇数据库执行 `vocabulary.postgresql.sql` 即可。

导入WordSpire时，数据库需要已经建立项目的内容表，依次执行 `vocabulary.postgresql.sql` 和 `wordspire.postgresql.sql`。导入使用事务和固定教材ID；重复执行更新该教材已有记录。

课程及内容ID的前缀为 `pep3a_1244`。题目使用项目支持的 `meaning_match` 类型。每道题目包含四个中文选项，`correct_index`从0开始计数。选择题按单元原有顺序分配至关卡，每个关卡最多10道题目；难度、关卡名称及奖励属于题库生成配置。

选项来自该教材词汇。生成时排除同一英文词语的其他释义及中文释义重叠项，保留每道题目唯一的正确选项。

## 核验范围

SQL已在本地隔离的实际PostgreSQL引擎中，使用项目当前数据库结构执行导入、读取全部记录及重复导入核验。具体数据库版本和结构文件SHA-256见 `verification.json`。

在线数据库尚未执行导入，应用页面尚未进行题库使用验证。当前交付为词汇和题库导入文件。
