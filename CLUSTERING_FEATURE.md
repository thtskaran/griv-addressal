# Automatic Grievance Clustering Feature

## Overview

This feature implements automatic clustering of similar grievances using cosine similarity on OpenAI embeddings. The clustering engine runs as a background process that updates every 30 seconds to group related grievances together.

## How It Works

### 1. Embedding Generation
- When a grievance is submitted, its description is converted to a vector embedding using OpenAI's embedding API
- Embeddings are stored in MongoDB for efficient similarity calculations

### 2. Clustering Algorithm
- **Algorithm**: DBSCAN (Density-Based Spatial Clustering of Applications with Noise)
- **Similarity Metric**: Cosine similarity on normalized embeddings
- **Update Frequency**: Every 30 seconds (configurable)
- **Parameters**:
  - `eps`: 0.3 (maximum distance between samples in same cluster)
  - `min_samples`: 2 (minimum grievances to form a cluster)

### 3. Cluster Assignment
- Each grievance is assigned to a cluster based on similarity
- Cluster labels are stored as: `cluster_0`, `cluster_1`, etc.
- Grievances that don't fit any cluster are marked as `unclustered_{id}`
- Assignments are persisted in both PostgreSQL and MongoDB

### 4. Analytics Generation
- Cluster statistics are computed including:
  - Number of grievances per cluster
  - Top tags associated with each cluster
  - Tag frequency distribution
- Analytics are stored in MongoDB for fast retrieval

## Backend Implementation

### New Components

#### `GrievanceClusteringEngine` (utils.py)
Background service that:
- Runs clustering algorithm every 30 seconds
- Fetches all grievance embeddings from MongoDB
- Applies DBSCAN clustering with cosine similarity
- Updates PostgreSQL with cluster assignments
- Generates cluster analytics

#### New API Endpoints

**POST /admin/clustering/trigger**
- Manually trigger clustering immediately
- Returns clustering status and last update time

**GET /admin/clustering/status**
- Get current clustering engine status
- Returns: running state, last cluster time, update interval

**GET /admin/analytics/clusters** (existing, enhanced)
- Fetch cluster analytics
- Returns: cluster counts, top tags, distributions

### Key Functions

```python
# Start clustering engine on app startup
clustering_engine = get_clustering_engine()
clustering_engine.start()

# Manually trigger clustering
trigger_clustering()

# Get clustering status
get_clustering_status()
```

## Frontend Implementation

### Analytics Dashboard Updates

#### New Clustering Status Card
Displays:
- Real-time clustering engine status (Running/Stopped)
- Update interval (30 seconds)
- Last clustering timestamp
- Manual trigger button

#### Enhanced Cluster Analytics Chart
- Horizontal bar chart showing grievances per cluster
- Tooltip with cluster details and top tags
- Auto-refreshes every 30 seconds with new clustering data

### API Integration

```typescript
// Trigger clustering manually
await triggerClustering();

// Get clustering status
const status = await getClusteringStatus();

// Fetch cluster analytics
const analytics = await getClusterAnalytics();
```

## Configuration

### Backend (config.py)
```python
# Clustering interval can be configured via environment variable
CLUSTERING_INTERVAL_SECONDS=30  # Default: 30 seconds
```

### Algorithm Parameters (utils.py)
```python
# DBSCAN parameters
eps = 0.3           # Distance threshold (0.2-0.4 works well)
min_samples = 2     # Minimum grievances per cluster
```

## Dependencies

### New Python Packages
- `numpy>=1.24.0` - Array operations and numerical computing
- `scikit-learn>=1.3.0` - DBSCAN clustering algorithm

Install with:
```bash
pip install numpy scikit-learn
```

## Database Schema

### PostgreSQL (Grievance table)
- `cluster` (String): Primary cluster label
- `cluster_tags` (Array): List of cluster labels/tags

### MongoDB Collections

**grievance_embeddings**
```json
{
  "grievance_id": 123,
  "embedding": [0.123, -0.456, ...],  // 1536-dim vector
  "meta_info": {
    "tags": ["library", "ac_issue"],
    "cluster": "cluster_5",
    "student_id": 1
  },
  "updated_at": "2025-10-17T..."
}
```

**cluster_analytics**
```json
{
  "type": "cluster_analytics",
  "cluster": "cluster_0",
  "cluster_id": 0,
  "count": 15,
  "grievance_ids": [1, 5, 7, ...],
  "top_tags": ["library", "wifi", "ac"],
  "tag_distribution": {
    "library": 10,
    "wifi": 8,
    "ac": 5
  },
  "updated_at": "2025-10-17T..."
}
```

## Usage Examples

### Viewing Cluster Analytics

1. Navigate to Admin Dashboard → Analytics
2. View the "Grievance Clusters (Cosine Similarity)" section
3. See real-time cluster distributions and statistics
4. Click "Trigger Now" to manually force clustering update

### Programmatic Access

```python
# Backend: Manually trigger clustering
from utils import trigger_clustering
result = trigger_clustering()
# Returns: {"status": "triggered", "last_cluster_time": "...", "interval_seconds": 30}

# Backend: Get clustering status
from utils import get_clustering_status
status = get_clustering_status()
# Returns: {"running": true, "last_cluster_time": "...", "interval_seconds": 30}
```

```typescript
// Frontend: Trigger clustering
const result = await triggerClustering();

// Frontend: Check status
const status = await getClusteringStatus();

// Frontend: Get analytics
const { analytics } = await getClusterAnalytics();
```

## Benefits

1. **Automatic Identification**: Finds similar grievances without manual tagging
2. **Real-time Updates**: Clusters update every 30 seconds automatically
3. **Scalable**: Handles large numbers of grievances efficiently
4. **Accurate**: Uses state-of-the-art embeddings and clustering algorithms
5. **Actionable**: Helps admins identify patterns and recurring issues

## Monitoring

### Logs
The clustering engine logs detailed information:
```
INFO: Started Grievance Clustering Engine (interval=30s)
INFO: Clustering 150 grievances...
INFO: DBSCAN clustering completed: found 12 unique clusters
INFO: Updated 150 grievances with cluster assignments
INFO: Generated analytics for 12 clusters
INFO: Clustering operation completed successfully
```

### Health Checks
- Check `/admin/clustering/status` endpoint
- Monitor `last_cluster_time` to ensure updates are occurring
- Verify cluster counts in analytics dashboard

## Troubleshooting

### Clustering Not Running
- Check if numpy and scikit-learn are installed
- Verify clustering engine started on app initialization
- Check backend logs for errors

### No Clusters Formed
- Ensure at least 2 grievances exist
- Adjust `eps` parameter (increase for looser clusters)
- Check if embeddings are being generated properly

### Slow Clustering
- Reduce clustering interval if too many grievances
- Consider using batch processing for large datasets
- Monitor MongoDB query performance

## Future Enhancements

1. **Cluster Labeling**: Use LLM to generate human-readable cluster names
2. **Hierarchical Clustering**: Create sub-clusters for better organization
3. **Trend Detection**: Identify emerging cluster patterns over time
4. **Smart Routing**: Auto-assign new grievances to departments based on cluster
5. **Visualization**: Network graph showing cluster relationships
6. **Similarity Search**: Find similar past grievances for new submissions

## Technical Notes

### Cosine Similarity
- Measures angle between embedding vectors
- Range: -1 (opposite) to 1 (identical)
- DBSCAN uses cosine distance = 1 - cosine_similarity
- Embeddings are L2-normalized before clustering

### DBSCAN vs K-Means
- DBSCAN: Doesn't require predefined cluster count
- DBSCAN: Handles noise points (outliers)
- DBSCAN: Better for non-spherical clusters
- K-Means: Requires knowing K in advance

### Performance
- Complexity: O(n²) for distance matrix computation
- Optimized with numpy vectorization
- Runs in background thread (non-blocking)
- Typical clustering time: <1s for 100 grievances
