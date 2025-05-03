export function AboutContent() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">About Clinical Research AI</h1>
      
      <p>
        Clinical Research AI Assistant is a proof-of-concept (PoC) designed to demonstrate
        the potential of AI-powered tools in supporting clinical research professionals with
        Good Clinical Practice (GCP) and compliance questions.
      </p>
      
      <h2 className="text-xl font-semibold mt-6">Purpose</h2>
      <p>
        The purpose of this PoC is to explore whether AI can effectively handle real-world
        GCP/compliance questions with accuracy and reliability, and whether clinical users
        would find value in such an AI assistant.
      </p>
      
      <h2 className="text-xl font-semibold mt-6">Features</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>Chat interface for free-text questions related to GCP and compliance</li>
        <li>Voice input capability for hands-free operation</li>
        <li>Multiple AI model support</li>
        <li>Citation of sources in responses</li>
        <li>Option to save or discard conversation history</li>
      </ul>
      
      <h2 className="text-xl font-semibold mt-6">Limitations</h2>
      <p>
        As a proof of concept, this application has some limitations:
      </p>
      <ul className="list-disc pl-5 space-y-2">
        <li>No multi-role differentiation (e.g., CRA vs. CRC vs. sponsor)</li>
        <li>No dynamic ingestion of new protocols during the PoC phase</li>
        <li>No full user management, history tracking, or audit logs</li>
        <li>AI responses should be verified by qualified professionals</li>
      </ul>
      
      <h2 className="text-xl font-semibold mt-6">Feedback</h2>
      <p>
        This is an early prototype, and your feedback is valuable for future development.
        Please share your thoughts on the accuracy, usability, and potential improvements
        for this tool.
      </p>
    </div>
  );
}