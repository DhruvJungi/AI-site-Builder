import crypto from "crypto";
import { Project } from "../models/Project.js";
import { generateProject } from "../services/ai.js";

function hashContent(content) {
    return crypto.createHash("md5").update(content).digest("hex").slice(0, 12);
}

async function runBackgroundGeneration(projectId, prompt) {
    console.log(`[Background AI] Starting generation for project ${projectId}: ${prompt.slice(0, 80)}...`);

    try {
        await Project.findByIdAndUpdate(projectId, {
            status: "generating",
            error: null,
            currentFile: null,
            filesPlanned: [],
            filesGenerated: [],
        });

        const result = await generateProject(prompt, {
            onPlan: async (plan) => {
                await Project.findByIdAndUpdate(projectId, {
                    status: "generating",
                    name: plan.projectName || "Generated Project",
                    description: plan.projectDescription || prompt,
                    filesPlanned: plan.files.map(({ path, description }) => ({ path, description })),
                });
            },
            onFileStart: async (path) => {
                await Project.findByIdAndUpdate(projectId, { currentFile: path });
            },
            onFileComplete: async (path) => {
                await Project.findByIdAndUpdate(projectId, {
                    currentFile: path,
                    $addToSet: { filesGenerated: path },
                });
            },
        });

        const project = await Project.findById(projectId);
        if (!project) return;

        project.name = result.name || project.name;
        project.description = result.description || project.description;
        project.files = Object.fromEntries(
            Object.entries(result.files).map(([path, content]) => [
                path,
                { content, hash: hashContent(content) },
            ]),
        );
        project.filesGenerated = Object.keys(result.files);
        project.currentFile = null;
        project.status = "completed";
        project.version = Math.max(project.version, 1);
        project.error = null;
        project.messages.push({ role: "assistant", content: "Website generation completed." });
        await project.save();
    } catch (err) {
        console.error(`[Background AI] Generation failed for project ${projectId}:`, err);
        await Project.findByIdAndUpdate(projectId, {
            status: "failed",
            currentFile: null,
            error: err.message || "Failed to generate project",
            $push: {
                messages: {
                    role: "assistant",
                    content: "Website generation failed. Please try again.",
                },
            },
        });
    }
}

export async function createProject(req, res) {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
        res.status(400).json({ error: "prompt is required" });
        return;
    }

    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    const project = await Project.create({
        name: "Planning project...",
        description: prompt,
        files: {},
        messages: [
            { role: "user", content: prompt },
            { role: "assistant", content: "Planning project structure..." },
        ],
        version: 0,
        owner: req.user.userId,
        status: "pending",
        filesPlanned: [],
        filesGenerated: [],
        currentFile: null,
        error: null,
    });

    runBackgroundGeneration(project._id.toString(), prompt).catch((err) => {
        console.error(`[Background AI] Fatal generation error for project ${project._id}:`, err);
    });

    res.status(201).json({
        _id: project._id,
        name: project.name,
        description: project.description,
        files: {},
        messages: project.messages,
        version: project.version,
        status: project.status,
        filesPlanned: project.filesPlanned,
        filesGenerated: project.filesGenerated,
        currentFile: project.currentFile,
        error: project.error,
        createdAt: project.createdAt,
    });
}

export async function listProjects(req, res) {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    const projects = await Project.find(
        { owner: req.user.userId },
        { name: 1, description: 1, version: 1, createdAt: 1, updatedAt: 1 },
    ).sort({ updatedAt: -1 });

    res.json(projects);
}

export async function getProject(req, res) {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    const project = await Project.findOne({ _id: req.params.id, owner: req.user.userId });

    if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
    }

    const filesObj = {};
    for (const [path, entry] of Object.entries(project.files || {})) {
        if (entry && typeof entry === "object" && typeof entry.content === "string") {
            filesObj[path] = entry.content;
        } else if (typeof entry === "string") {
            filesObj[path] = entry;
        }
    }

    res.json({
        _id: project._id,
        name: project.name,
        description: project.description,
        files: filesObj,
        messages: project.messages,
        version: project.version,
        status: project.status,
        filesPlanned: project.filesPlanned,
        filesGenerated: project.filesGenerated,
        currentFile: project.currentFile,
        error: project.error,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
    });
}

export async function deleteProject(req, res) {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    const result = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user.userId });
    if (!result) {
        res.status(404).json({ error: "Project not found" });
        return;
    }

    res.json({ success: true });
}

export async function updateProjectFiles(req, res) {
    const { files } = req.body;
    if (!files || typeof files !== "object") {
        res.status(400).json({ error: "files object is required" });
        return;
    }

    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    const project = await Project.findOne({ _id: req.params.id, owner: req.user.userId });

    if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
    }

    const newFiles = {};
    for (const [path, content] of Object.entries(files)) {
        if (typeof content === "string") {
            newFiles[path] = { content, hash: hashContent(content) };
        } else if (content && typeof content === "object" && typeof content.content === "string") {
            newFiles[path] = {
                ...content,
                hash: content.hash || hashContent(content.content),
            };
        }
    }

    project.files = newFiles;
    await project.save();

    const filesObj = {};
    for (const [path, entry] of Object.entries(project.files || {})) {
        if (entry && typeof entry === "object" && typeof entry.content === "string") {
            filesObj[path] = entry.content;
        } else if (typeof entry === "string") {
            filesObj[path] = entry;
        }
    }

    res.json({
        _id: project._id,
        name: project.name,
        description: project.description,
        files: filesObj,
        messages: project.messages,
        version: project.version,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
    });
}

export async function publishProjectFiles(req, res) {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    const project = await Project.findOneAndUpdate(
        { _id: req.params.id, owner: req.user.userId },
        { published: true },
        { new: true },
    );

    if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
    }

    res.json({ success: true, published: project.published });
}

export async function getPublicProject(req, res) {
    const project = await Project.findById(req.params.id);
    if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
    }

    if (!project.published) {
        res.status(403).json({ error: "Project is not published yet" });
        return;
    }

    const filesObj = {};
    for (const [path, entry] of Object.entries(project.files || {})) {
        if (entry && typeof entry === "object" && typeof entry.content === "string") {
            filesObj[path] = entry.content;
        } else if (typeof entry === "string") {
            filesObj[path] = entry;
        }
    }

    res.json({
        _id: project._id,
        name: project.name,
        description: project.description,
        files: filesObj,
        version: project.version,
    });
}
