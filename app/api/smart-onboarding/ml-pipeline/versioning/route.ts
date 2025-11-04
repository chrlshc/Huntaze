import { NextRequest, NextResponse } from 'next/server';
import { modelVersioningService } from '../../../../../lib/smart-onboarding/services/modelVersioningService';
import { logger } from '../../../../../lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    switch (action) {
      case 'create':
        const { modelId, modelData, metadata, parentVersion } = body;
        
        if (!modelId || !modelData || !metadata) {
          return NextResponse.json(
            { error: 'Model ID, model data, and metadata are required' },
            { status: 400 }
          );
        }

        const version = await modelVersioningService.createVersion(
          modelId,
          modelData,
          metadata,
          parentVersion
        );
        
        return NextResponse.json({
          success: true,
          version,
          message: 'Model version created successfully'
        });

      case 'tag':
        const { modelId: tagModelId, tagName, version: tagVersion, description, tagMetadata } = body;
        
        if (!tagModelId || !tagName || !tagVersion) {
          return NextResponse.json(
            { error: 'Model ID, tag name, and version are required' },
            { status: 400 }
          );
        }

        const tag = await modelVersioningService.createTag(
          tagModelId,
          tagName,
          tagVersion,
          description || '',
          tagMetadata || {}
        );
        
        return NextResponse.json({
          success: true,
          tag,
          message: 'Model tag created successfully'
        });

      case 'branch':
        const { modelId: branchModelId, branchName, baseVersion, branchDescription } = body;
        
        if (!branchModelId || !branchName || !baseVersion) {
          return NextResponse.json(
            { error: 'Model ID, branch name, and base version are required' },
            { status: 400 }
          );
        }

        const branch = await modelVersioningService.createBranch(
          branchModelId,
          branchName,
          baseVersion,
          branchDescription || ''
        );
        
        return NextResponse.json({
          success: true,
          branch,
          message: 'Model branch created successfully'
        });

      case 'rollback':
        const { modelId: rollbackModelId, targetVersion } = body;
        
        if (!rollbackModelId || !targetVersion) {
          return NextResponse.json(
            { error: 'Model ID and target version are required' },
            { status: 400 }
          );
        }

        const rollbackVersion = await modelVersioningService.rollbackToVersion(
          rollbackModelId,
          targetVersion
        );
        
        return NextResponse.json({
          success: true,
          version: rollbackVersion,
          message: 'Model rolled back successfully'
        });

      case 'import':
        const { importData } = body;
        
        if (!importData) {
          return NextResponse.json(
            { error: 'Import data is required' },
            { status: 400 }
          );
        }

        const importedVersion = await modelVersioningService.importVersion(importData);
        
        return NextResponse.json({
          success: true,
          version: importedVersion,
          message: 'Model version imported successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: create, tag, branch, rollback, import' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('ML versioning endpoint failed', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const modelId = searchParams.get('modelId');
    const version = searchParams.get('version');

    switch (action) {
      case 'get':
        if (!modelId || !version) {
          return NextResponse.json(
            { error: 'Model ID and version are required' },
            { status: 400 }
          );
        }

        const modelVersion = await modelVersioningService.getVersion(modelId, version);
        
        return NextResponse.json({
          success: true,
          version: modelVersion
        });

      case 'list':
        if (!modelId) {
          return NextResponse.json(
            { error: 'Model ID is required' },
            { status: 400 }
          );
        }

        const options = {
          limit: parseInt(searchParams.get('limit') || '20'),
          offset: parseInt(searchParams.get('offset') || '0'),
          branch: searchParams.get('branch') || undefined,
          tag: searchParams.get('tag') || undefined,
          status: searchParams.get('status') || undefined
        };

        const versions = await modelVersioningService.listVersions(modelId, options);
        
        return NextResponse.json({
          success: true,
          versions
        });

      case 'compare':
        const fromVersion = searchParams.get('fromVersion');
        const toVersion = searchParams.get('toVersion');
        
        if (!modelId || !fromVersion || !toVersion) {
          return NextResponse.json(
            { error: 'Model ID, from version, and to version are required' },
            { status: 400 }
          );
        }

        const comparison = await modelVersioningService.compareVersions(
          modelId,
          fromVersion,
          toVersion
        );
        
        return NextResponse.json({
          success: true,
          comparison
        });

      case 'lineage':
        if (!modelId) {
          return NextResponse.json(
            { error: 'Model ID is required' },
            { status: 400 }
          );
        }

        const lineage = await modelVersioningService.getModelLineage(modelId);
        
        return NextResponse.json({
          success: true,
          lineage
        });

      case 'export':
        if (!modelId || !version) {
          return NextResponse.json(
            { error: 'Model ID and version are required' },
            { status: 400 }
          );
        }

        const format = searchParams.get('format') as 'json' | 'binary' || 'json';
        const exportData = await modelVersioningService.exportVersion(modelId, version, format);
        
        if (format === 'binary') {
          return new NextResponse(exportData, {
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Disposition': `attachment; filename="${modelId}_${version}.bin"`
            }
          });
        }
        
        return NextResponse.json({
          success: true,
          exportData
        });

      default:
        return NextResponse.json({
          success: true,
          availableActions: ['get', 'list', 'compare', 'lineage', 'export']
        });
    }

  } catch (error) {
    logger.error('ML versioning GET endpoint failed', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');
    const version = searchParams.get('version');
    const force = searchParams.get('force') === 'true';

    if (!modelId || !version) {
      return NextResponse.json(
        { error: 'Model ID and version are required' },
        { status: 400 }
      );
    }

    await modelVersioningService.deleteVersion(modelId, version, force);
    
    return NextResponse.json({
      success: true,
      message: 'Model version deleted successfully'
    });

  } catch (error) {
    logger.error('ML versioning DELETE endpoint failed', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}