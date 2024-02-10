import {
	TFile,
	WorkspaceLeaf,
	TextFileView,
	MarkdownView,
	Plugin,
} from "obsidian";

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};
// todo abstract class ConvertableFileView extends MarkdownView {
abstract class ConvertableFileView extends TextFileView {
	plugin: MyPlugin;
	fileContent: string;
	header: HTMLElement | null = null;
	content: HTMLElement | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getDisplayText(): string {
		return this.file?.name ?? "???";
	}

	getContext(file?: TFile) {
		return file?.path ?? this.file?.path ?? "";
	}

	async onOpen() {
		await super.onOpen();

		this.header = document.createElement("div");
		this.header.id = "docxer-header";

		const warningText = document.createElement("span");
		warningText.innerText =
			"Obsidian不支持预览当前文件，点击使用默认应用打开";
		warningText.style.textAlign = "center";
		warningText.style.fontSize = "24px";
		warningText.style.fontWeight = "bold";
		warningText.style.color = "red";
		this.header.appendChild(warningText);

		const convertButton = document.createElement("button");
		convertButton.id = "open-in-default-editor-button";
		convertButton.innerText = "open in default";
		//@ts-ignore
		convertButton.onclick = () => this.app.commands.executeCommandById("open-with-default-app:open");
		this.header.appendChild(convertButton);

		//todo 勉强可以用，但是用完之后就不刷新侧边栏的反链面板了
		// const backlinkpane=document.querySelector('.backlink-pane')
		// if(backlinkpane){this.header.appendChild(backlinkpane);}else{console.log('backlink-pane not found')}
		this.containerEl.insertAfter(this.header, this.containerEl.firstChild);
	}

	async onClose() {
		await super.onClose();
		if (this.header) this.header.remove();
	}

	abstract onFileOpen(): Promise<HTMLElement | null>;
	async onLoadFile(file: TFile) {
		await super.onLoadFile(file);

		this.content = await this.onFileOpen();
		if (this.content) this.contentEl.appendChild(this.content);
	}

	async onUnloadFile(file: TFile) {
		await super.onUnloadFile(file);
		if (this.content) this.content.remove();
	}

	clear(): void {}

	setViewData(data: string): void {
		this.fileContent = data;
	}

	getViewData(): string {
		return this.fileContent;
	}
}
class WarningView extends ConvertableFileView {
	static readonly VIEW_TYPE = "warning-view";

	getViewType(): string {
		return WarningView.VIEW_TYPE;
	}

	async onFileOpen(): Promise<HTMLElement | null> {
		return null;
	}
}

const FILETYPE_MAP: { [key: string]: typeof ConvertableFileView } = {
	"7z": WarningView,
	pptx: WarningView,
	docx: WarningView,
	xlsx: WarningView,
	html: WarningView,
	zip: WarningView,
	rtf: WarningView,
	epub: WarningView,
	mobi: WarningView,
};

function registerFilePreviews(plugin: Plugin) {
	// @ts-ignore
	plugin.registerView(WarningView.VIEW_TYPE,(leaf) => new WarningView(leaf, plugin));
	for (const [filetype, view] of Object.entries(FILETYPE_MAP)) {
		// @ts-ignore
		plugin.registerExtensions([filetype], view.VIEW_TYPE);
		// console.log(`registering extension for ${filetype}`);
	}
}

//!main
export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		registerFilePreviews(this);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
