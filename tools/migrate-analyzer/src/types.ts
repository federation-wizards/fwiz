export type HeuristicStrategy = "route-based" | "folder-based" | "import-graph" | "component-frequency";
export interface AnalyzedFile { relativePath: string; absolutePath: string; imports: string[]; folderFeature?: string; }
export interface RouteMatch { path: string; sourceFile: string; featureHint?: string; }
export interface ComponentUsage { file: string; importCount: number; importedBy: string[]; }
export interface ProposedRemote { name: string; strategies: HeuristicStrategy[]; routes: string[]; files: string[]; entryCandidates: string[]; sharedDependencies: string[]; confidence: number; rationale: string[]; }
export interface SplitPlan { analyzedAt: string; rootDir: string; summary: { totalFiles: number; proposedRemotes: number; sharedFiles: number; shellFiles: number; }; heuristics: Record<HeuristicStrategy, { enabled: boolean; notes: string }>; remotes: ProposedRemote[]; shell: { files: string[]; rationale: string[] }; shared: { files: string[]; rationale: string[] }; importGraph: { nodes: string[]; edges: Array<{ from: string; to: string }> }; warnings: string[]; }
export interface AnalyzeOptions { rootDir: string; featuresDir?: string; }
