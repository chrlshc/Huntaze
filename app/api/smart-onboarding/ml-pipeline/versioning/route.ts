import { NextRequest, NextResponse } from 'next/server';
import { mlPipelineFacade } from '../../../../../lib/smart-onboarding/services/mlPipelineFacade';
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

        const version = await mlPipelineFacade.createVersion(
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

        const tag = await mlPipelineFacade.createTag(
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

        const branch = await mlPipelineFacade.createBranch(
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

        const rollbackVersion = await mlPipelineFacade.rollbackToVersion(
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

        const importedVersion = await mlPipelineFacade.importVersion(importData);
        
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

        const modelVersion = await mlPipelineFacade.getVersion(modelId, version);
        
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

        const versions = await mlPipelineFacade.listVersions(modelId, options);
        
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

        const comparison = await mlPipelineFacade.compareVersions(
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

        const lineage = await mlPipelineFacade.getModelLineage(modelId);
        
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
        const exportResult = await mlPipelineFacade.exportVersion(modelId, version, format);
        
        // Check if export was successful
        if (!exportResult.success || !exportResult.data) {
          return NextResponse.json(
            { error: exportResult.error?.message || 'Export failed' },
            { status: 500 }
          );
        }
        
        if (format === 'binary') {
          // For binary format, exportResult.data should be a Buffer or Uint8Array
          return new NextResponse(exportResult.data as BodyInit, {
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Disposition': `attachment; filename="${modelId}_${version}.bin"`
            }
          });
        }
        
        return NextResponse.json({
          success: true,
          exportData: exportResult.data
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

    await mlPipelineFacade.deleteVersion(modelId, version, force);
    
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