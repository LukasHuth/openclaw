import { SANDBOX_AGENT_WORKSPACE_MOUNT } from "./constants.js";
import type { SandboxWorkspaceAccess } from "./types.js";

export const SANDBOX_MOUNT_FORMAT_VERSION = 2;

export function resolveSandboxWorkspaceVolumeName(params: {
  containerName: string;
  workspaceVolume?: string;
}): string {
  return params.workspaceVolume?.trim() || `${params.containerName}-workspace`;
}

function formatManagedWorkspaceBind(params: {
  hostPath: string;
  containerPath: string;
  readOnly: boolean;
}): string {
  return `${params.hostPath}:${params.containerPath}:${params.readOnly ? "ro,z" : "z"}`;
}

export function appendWorkspaceMountArgs(params: {
  args: string[];
  workspaceDir: string;
  agentWorkspaceDir: string;
  workdir: string;
  workspaceAccess: SandboxWorkspaceAccess;
  workspaceVolume?: string;
}) {
  const { args, workspaceDir, agentWorkspaceDir, workdir, workspaceAccess, workspaceVolume } =
    params;

  if (workspaceAccess === "volume") {
    const volumeName = workspaceVolume?.trim();
    if (!volumeName) {
      throw new Error(
        'sandbox.workspaceAccess is set to "volume" but no workspace volume name was resolved. Configure sandbox.docker.workspaceVolume (or workspace-volume), or let OpenClaw derive a default container-based volume name.',
      );
    }
    args.push("--mount", `type=volume,source=${volumeName},target=${workdir}`);
    return;
  }

  args.push(
    "-v",
    formatManagedWorkspaceBind({
      hostPath: workspaceDir,
      containerPath: workdir,
      readOnly: workspaceAccess !== "rw",
    }),
  );
  if (workspaceAccess !== "none" && workspaceDir !== agentWorkspaceDir) {
    args.push(
      "-v",
      formatManagedWorkspaceBind({
        hostPath: agentWorkspaceDir,
        containerPath: SANDBOX_AGENT_WORKSPACE_MOUNT,
        readOnly: workspaceAccess === "ro",
      }),
    );
  }
}
