import express from 'express';
import { uploadMultiple, handleUploadError } from '../middleware/upload.js';
import { textExtractionService } from '../services/TextExtractionService.js';

const router = express.Router();

// POST /api/files/upload - Upload and extract text from files
router.post('/upload', uploadMultiple, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        error: 'No files uploaded',
        message: 'Please select at least one file to upload'
      });
    }

    const results = [];
    
    // Process each uploaded file
    for (const file of req.files) {
      console.log(`Processing file: ${file.originalname} (${file.size} bytes)`);
      
      const extractionResult = await textExtractionService.extractText(file);
      
      results.push({
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        ...extractionResult
      });
    }

    // Calculate overall success rate
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    res.json({
      success: successCount > 0,
      message: `Processed ${successCount}/${totalCount} files successfully`,
      totalFiles: totalCount,
      successfulFiles: successCount,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('File upload processing error:', error);
    res.status(500).json({ 
      error: 'File processing failed',
      message: 'An error occurred while processing your files. Please try again.'
    });
  }
});

// POST /api/files/chat-upload - Upload files with chat message
router.post('/chat-upload', uploadMultiple, async (req, res) => {
  try {
    const { message, userId, chatId, userProfile, userIntent } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        error: 'No files uploaded',
        message: 'Please select at least one file to upload'
      });
    }

    // Extract text from all uploaded files
    const fileResults = [];
    let combinedAnalysis = {
      totalDocuments: 0,
      completeDocuments: 0,
      incompleteDocuments: 0,
      extractedFields: {},
      allIssues: [],
      allRecommendations: [],
      complianceScore: 0
    };

    for (const file of req.files) {
      console.log(`Processing file for chat: ${file.originalname}`);
      
      const extractionResult = await textExtractionService.extractText(file);
      
      if (extractionResult.success) {
        combinedAnalysis.totalDocuments++;
        
        const docAnalysis = extractionResult.documentAnalysis;
        if (docAnalysis.confidence >= 70) {
          combinedAnalysis.completeDocuments++;
        } else {
          combinedAnalysis.incompleteDocuments++;
        }
        
        // Merge extracted fields
        Object.assign(combinedAnalysis.extractedFields, docAnalysis.extractedFields);
        
        // Collect all issues and recommendations
        combinedAnalysis.allIssues.push(...docAnalysis.issues);
        combinedAnalysis.allRecommendations.push(...docAnalysis.recommendations);
        
        // Add to compliance score
        combinedAnalysis.complianceScore += docAnalysis.confidence;
      }
      
      fileResults.push({
        fileName: file.originalname,
        ...extractionResult
      });
    }

    // Calculate average compliance score
    if (combinedAnalysis.totalDocuments > 0) {
      combinedAnalysis.complianceScore = Math.round(combinedAnalysis.complianceScore / combinedAnalysis.totalDocuments);
    }

    // Build intelligent analysis message for AI
    const analysisPrompt = buildIntelligentAnalysisPrompt(message, fileResults, combinedAnalysis);

    // Forward to chat service with enhanced context
    const chatResponse = await fetch(`${req.protocol}://${req.get('host')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        chatId,
        message: analysisPrompt,
        userProfile,
        userIntent: userIntent || 'document_analysis',
        documentContext: {
          uploadedFiles: fileResults.length,
          successfulExtractions: fileResults.filter(r => r.success).length,
          combinedAnalysis,
          fileResults: fileResults.map(f => ({
            fileName: f.fileName,
            documentType: f.documentAnalysis?.documentType,
            confidence: f.documentAnalysis?.confidence,
            extractedFields: f.documentAnalysis?.extractedFields,
            issues: f.documentAnalysis?.issues
          }))
        }
      })
    });

    const chatData = await chatResponse.json();

    res.json({
      success: true,
      message: 'Files uploaded and analyzed successfully',
      fileResults,
      combinedAnalysis,
      chatResponse: chatData,
      enhancedMessage: message || 'Documents uploaded for comprehensive analysis',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat file upload error:', error);
    res.status(500).json({ 
      error: 'Chat file upload failed',
      message: 'Failed to process files and chat message. Please try again.'
    });
  }
});

// Helper function to build intelligent analysis prompt
function buildIntelligentAnalysisPrompt(userMessage, fileResults, combinedAnalysis) {
  const successfulFiles = fileResults.filter(r => r.success);
  
  let prompt = userMessage || 'Please analyze my uploaded documents for MSME compliance.';
  prompt += '\n\n=== DOCUMENT ANALYSIS RESULTS ===\n';
  
  // Overall summary
  prompt += `\nOVERALL SUMMARY:
- Total Documents: ${combinedAnalysis.totalDocuments}
- Complete Documents: ${combinedAnalysis.completeDocuments}
- Incomplete Documents: ${combinedAnalysis.incompleteDocuments}
- Average Compliance Score: ${combinedAnalysis.complianceScore}%\n`;

  // Document-by-document analysis
  prompt += '\nDOCUMENT DETAILS:\n';
  successfulFiles.forEach((file, index) => {
    const analysis = file.documentAnalysis;
    prompt += `\n${index + 1}. ${file.fileName}
   Type: ${analysis.documentType}
   Confidence: ${analysis.confidence}%
   Status: ${analysis.confidence >= 80 ? 'Complete ✅' : analysis.confidence >= 60 ? 'Partial ⚠️' : 'Incomplete ❌'}`;
   
    if (Object.keys(analysis.extractedFields).length > 0) {
      prompt += `\n   Extracted Data: ${JSON.stringify(analysis.extractedFields, null, 2)}`;
    }
    
    if (analysis.issues.length > 0) {
      prompt += `\n   Issues: ${analysis.issues.join(', ')}`;
    }
    prompt += '\n';
  });

  // Key findings
  if (Object.keys(combinedAnalysis.extractedFields).length > 0) {
    prompt += `\nKEY EXTRACTED INFORMATION:
${JSON.stringify(combinedAnalysis.extractedFields, null, 2)}\n`;
  }

  // Issues and recommendations
  if (combinedAnalysis.allIssues.length > 0) {
    prompt += `\nIDENTIFIED ISSUES:
${combinedAnalysis.allIssues.map(issue => `- ${issue}`).join('\n')}\n`;
  }

  prompt += `\nBased on this analysis, please provide:
1. A summary of what documents were uploaded and their compliance status
2. What information was successfully extracted and verified
3. Any missing or incomplete information
4. Specific recommendations for MSME compliance
5. Next steps the user should take
6. Any additional documents that might be needed

Please be specific and actionable in your response, focusing on MSME compliance requirements.`;

  return prompt;
}

// GET /api/files/supported-types - Get supported file types
router.get('/supported-types', (req, res) => {
  res.json({
    supportedTypes: {
      images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
      documents: ['.pdf', '.txt'],
      maxFileSize: '10MB',
      maxFiles: 5
    },
    examples: {
      'GST Certificate': 'Upload GST registration certificate (PDF or image)',
      'PAN Card': 'Upload PAN card (image format)',
      'Aadhaar Card': 'Upload Aadhaar card (image format)', 
      'Bank Statement': 'Upload bank statement (PDF)',
      'Business License': 'Upload business license (PDF or image)',
      'MSME Registration': 'Upload Udyam registration certificate (PDF or image)'
    }
  });
});

// Apply error handling middleware
router.use(handleUploadError);

export default router;