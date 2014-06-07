#include <string>
#include <node.h>
#include <v8.h>

using namespace v8;
using namespace node;

// Forward declaration. Usually, you do this in a header file.
Handle<Value> Factorial(const Arguments& args);
void FactorialAsyncWork(uv_work_t* req);
void FactorialAsyncAfter(uv_work_t* req);

// We use a struct to store information about the asynchronous "work request".
struct FactorialBaton {
    // This handle holds the callback function we'll call after the work request
    // has been completed in a threadpool thread. It's persistent so that V8
    // doesn't garbage collect it away while our request waits to be processed.
    // This means that we'll have to dispose of it later ourselves.
    Persistent<Function> callback;

    // Tracking errors that happened in the worker function. You can use any
    // variables you want. E.g. in some cases, it might be useful to report
    // an error number.
    bool error;
    std::string error_message;

    // Custom data you can pass through.
    int num;
    long result;
};

// The actual factorial recursion
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

// This function is executed in the main V8/JavaScript thread. That means it's
// safe to use V8 functions again. Don't forget the HandleScope!
void FactorialAsyncAfter(uv_work_t* req) {
    HandleScope scope;
    FactorialBaton* baton = static_cast<FactorialBaton*>(req->data);

    if (baton->error) {
        Local<Value> err = Exception::Error(String::New(baton->error_message.c_str()));

        // Prepare the parameters for the callback function.
        const unsigned argc = 1;
        Local<Value> argv[argc] = { err };

        // Wrap the callback function call in a TryCatch so that we can call
        // node's FatalException afterwards. This makes it possible to catch
        // the exception from JavaScript land using the
        // process.on('uncaughtException') event.
        TryCatch try_catch;
        baton->callback->Call(Context::GetCurrent()->Global(), argc, argv);
        if (try_catch.HasCaught()) {
            node::FatalException(try_catch);
        }
    }
    else {
        // In case the operation succeeded, convention is to pass null as the
        // first argument before the result arguments.
        // In case you produced more complex data, this is the place to convert
        // your plain C++ data structures into JavaScript/V8 data structures.
        const unsigned argc = 2;
        Local<Value> argv[argc] = {
            Local<Value>::New(Null()),
            Local<Value>::New(Number::New(baton->result))
        };

        // Wrap the callback function call in a TryCatch so that we can call
        // node's FatalException afterwards. This makes it possible to catch
        // the exception from JavaScript land using the
        // process.on('uncaughtException') event.
        TryCatch try_catch;
        baton->callback->Call(Context::GetCurrent()->Global(), argc, argv);
        if (try_catch.HasCaught()) {
            node::FatalException(try_catch);
        }
    }

    // The callback is a permanent handle, so we have to dispose of it manually.
    baton->callback.Dispose();

    // We also created the baton and the work_req struct with new, so we have to
    // manually delete both.
    delete baton;
    delete req;
}

// This function is executed in another thread at some point after it has been
// scheduled. IT MUST NOT USE ANY V8 FUNCTIONALITY. Otherwise your extension
// will crash randomly and you'll have a lot of fun debugging.
// If you want to use parameters passed into the original call, you have to
// convert them to PODs or some other fancy method.
void FactorialAsyncWork(uv_work_t* req) {
    // No HandleScope!

    FactorialBaton* baton = static_cast<FactorialBaton*>(req->data);

    // Do work in threadpool here.
    // Set baton->error_code/message on failures.
    baton->result = fact(baton->num);
}

// This is the function called directly from JavaScript land. It creates a
// work request object and schedules it for execution.
Handle<Value> Factorial(const Arguments& args) {

  HandleScope scope;

  // Really should check the number and type of the arguments.
  if (2 > args.Length()) {
    ThrowException(Exception::TypeError(String::New("Wrong number of arguments")));
    return scope.Close(Undefined());
  }

  if (!args[0]->IsNumber()) {
    ThrowException(Exception::TypeError(String::New("First argument must be an integer")));
    return scope.Close(Undefined());
  }

  if (!args[1]->IsFunction()) {
    ThrowException(Exception::TypeError(String::New("Second argument must be a callback function")));
    return scope.Close(Undefined());
  }

  int iNum = args[0]->NumberValue();
  Local<Function> callback = Local<Function>::Cast(args[1]);

  // The baton holds our custom status information for this asynchronous call,
  // like the callback function we want to call when returning to the main
  // thread and the status information.
  FactorialBaton* baton = new FactorialBaton();
  baton->error = false;
  baton->num = iNum;
  baton->callback = Persistent<Function>::New(callback);

  // This creates the work request struct.
  uv_work_t *req = new uv_work_t();
  req->data = baton;

  // Schedule our work request with libuv. Here you can specify the functions
  // that should be executed in the threadpool and back in the main thread
  // after the threadpool function completed.
  int status = uv_queue_work(uv_default_loop(), req, FactorialAsyncWork, (uv_after_work_cb)FactorialAsyncAfter);

  assert(0 == status);

  return Undefined();
}

void InitializeMethods(Handle<Object> target) {
  // Do Methods registration
  target->Set(String::NewSymbol("factorial"),
      FunctionTemplate::New(Factorial)->GetFunction());
}

// Expose the module to NodeJS
NODE_MODULE(factorial2, InitializeMethods);