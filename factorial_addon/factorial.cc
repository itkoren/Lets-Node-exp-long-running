#include <node.h>
#include <v8.h>

using namespace v8;

long fact(int n) {
  // Check for 0
  if (0 == n) {
    return 1;
  }
  else {
    // Do the recursion call
    return (n * fact(n - 1));
  }
}

Handle<Value> Factorial(const Arguments& args) {

  HandleScope scope;

  // Really should check the number and type of the arguments.
  int iNum = args[0]->NumberValue();

  // Invoke fact on iNum
  long lResult = fact(iNum);

  // Return the result to javascript
  return scope.Close(Number::New(lResult));
}

void InitializeMethods(Handle<Object> target) {
  // Do Methods registration
  target->Set(String::NewSymbol("factorial"),
      FunctionTemplate::New(Factorial)->GetFunction());

}

// Expose the module
NODE_MODULE(factorial, InitializeMethods);